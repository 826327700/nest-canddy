#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestParser = void 0;
const ts_morph_1 = require("ts-morph");
const path = require("path");
const enquirer_1 = require("./enquirer");
const ora = require("ora");
const fs = require("fs");
const uuid_1 = require("uuid");
const { initLocale, t } = require('../i18n');
const chalk = require('chalk');
class NestParser {
    constructor() {
        this.promptHistory = [];
        this.promptRoutes = [];
        this.sourceTree = [];
        this.config = {
            outputPath: './nestc'
        };
    }
    async initConfig(projectPath) {
        await initLocale();
        const cwd = projectPath || process.cwd();
        this.projectPath = cwd.replace(/\\/g, '/');
        console.log(t('projectPath'), this.projectPath);
        const configPath = path.resolve(cwd, 'nestcanddy.config.js');
        if (fs.existsSync(configPath)) {
            const config = require(configPath);
            this.config = Object.assign(this.config, config.server);
        }
        const spinner = ora('Loading');
        spinner.color = 'blue';
        spinner.text = chalk.blue(t('scanning'));
        spinner.start();
        const tsconfigPath = path.resolve(cwd, 'tsconfig.json');
        if (fs.existsSync(tsconfigPath)) {
            this.project = new ts_morph_1.Project({ tsConfigFilePath: tsconfigPath });
        }
        else {
            spinner.text = chalk.red(t('noTsConfig'));
            spinner.fail();
            process.exit(1);
        }
        this.srcPath = this.project.getCompilerOptions().baseUrl || this.project.getCompilerOptions().rootDir;
        if (!this.srcPath.endsWith("src")) {
            this.srcPath += "/src";
        }
        spinner.text = chalk.green(t('scanComplete'));
        spinner.succeed();
    }
    getProjectTree() {
        let rootSourceFile = this.project.getSourceFile("app.module.ts");
        if (rootSourceFile) {
            this.sourceTree = [];
            this.scanProjectTree(rootSourceFile, this.sourceTree);
            function removeSourceFileField(obj) {
                if (Array.isArray(obj)) {
                    return obj.map(item => removeSourceFileField(item));
                }
                else if (typeof obj === 'object' && obj !== null) {
                    const { sourceFile, ...rest } = obj;
                    return Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, removeSourceFileField(value)]));
                }
                return obj;
            }
            let jsonTree = removeSourceFileField(this.sourceTree);
            return jsonTree;
        }
        return [];
    }
    async start() {
        let rootSourceFile = this.project.getSourceFile("app.module.ts");
        if (rootSourceFile) {
            let moduleInfos = [];
            this.scanModuleTree(rootSourceFile, moduleInfos, false);
            this.createPrompt(moduleInfos);
        }
        return;
    }
    scanProjectTree(sourceFile, moduleInfos) {
        const moduleDecorators = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.Decorator).filter(decorator => {
            return decorator.getName() === "Module";
        });
        for (const decorator of moduleDecorators) {
            const classNode = decorator.getParent();
            const moduleName = classNode.getName();
            let moduleDecorator = classNode.getDecorator("Module");
            if (moduleDecorator) {
                const args = moduleDecorator.getArguments();
                for (const arg of args) {
                    if (arg.getKind() === ts_morph_1.SyntaxKind.ObjectLiteralExpression) {
                        let moduleInfo = moduleInfos.find(item => item.moduleName == moduleName);
                        if (!moduleInfo) {
                            moduleInfo = {
                                nodeId: (0, uuid_1.v4)(),
                                desc: classNode.getJsDocs().map(jsDoc => jsDoc.getComment()),
                                moduleName,
                                controllers: [],
                                children: [],
                                sourceFile: sourceFile
                            };
                            moduleInfos.push(moduleInfo);
                        }
                        const obj = arg;
                        const controllersProperty = obj.getProperty("controllers");
                        if (controllersProperty) {
                            const elements = controllersProperty.getInitializer().getElements();
                            for (const element of elements) {
                                const elementText = element.getText();
                                const importInfo = this.getImportByName(sourceFile, elementText);
                                const controllerNode = importInfo.sourceFile.getClass(elementText);
                                const controllerDecorator = controllerNode.getDecorator("Controller");
                                const controllerDecoArgs = this.parseDecoratorArgs(controllerDecorator);
                                let routeKey = "/";
                                if (controllerDecoArgs.length > 0) {
                                    routeKey = '/' + controllerDecoArgs[0].value;
                                }
                                const controllerInfo = {
                                    nodeId: (0, uuid_1.v4)(),
                                    controllerName: elementText,
                                    routeKey,
                                    desc: controllerNode.getJsDocs().map(jsDoc => jsDoc.getComment()),
                                    methods: [],
                                    sourceFile: importInfo.sourceFile
                                };
                                moduleInfo.controllers.push(controllerInfo);
                                importInfo.sourceFile.getClass(elementText).getMethods().forEach(methodNode => {
                                    let methodInfo = this.parseMethod(methodNode);
                                    methodInfo["nodeId"] = (0, uuid_1.v4)();
                                    methodInfo["desc"] = methodInfo.jsDocs.map(jsDoc => jsDoc.description);
                                    methodInfo["parentRouteKey"] = routeKey;
                                    methodInfo["sourceFile"] = importInfo.sourceFile;
                                    controllerInfo.methods.push(methodInfo);
                                });
                            }
                        }
                        const importsProperty = obj.getProperty("imports");
                        if (importsProperty) {
                            const elements = importsProperty.getInitializer().getElements();
                            for (const element of elements) {
                                const elementText = element.getText();
                                const importInfo = this.getImportByName(sourceFile, elementText);
                                if (importInfo) {
                                    const elementSourceFile = importInfo.sourceFile;
                                    this.scanProjectTree(elementSourceFile, moduleInfo.children);
                                }
                            }
                        }
                    }
                }
            }
        }
        return moduleInfos;
    }
    scanModuleTree(sourceFile, moduleInfos, onlyJson = false) {
        const moduleDecorators = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.Decorator).filter(decorator => {
            return decorator.getName() === "Module";
        });
        for (const decorator of moduleDecorators) {
            const classNode = decorator.getParent();
            const moduleName = classNode.getName();
            let moduleDecorator = classNode.getDecorator("Module");
            if (moduleDecorator) {
                const args = moduleDecorator.getArguments();
                for (const arg of args) {
                    if (arg.getKind() === ts_morph_1.SyntaxKind.ObjectLiteralExpression) {
                        let moduleInfo = moduleInfos.find(item => item.moduleName == moduleName);
                        if (!moduleInfo) {
                            moduleInfo = {
                                moduleName,
                                controllers: [],
                                children: []
                            };
                            moduleInfos.push(moduleInfo);
                        }
                        const obj = arg;
                        const controllersProperty = obj.getProperty("controllers");
                        if (controllersProperty) {
                            const elements = controllersProperty.getInitializer().getElements();
                            for (const element of elements) {
                                const elementText = element.getText();
                                const importInfo = this.getImportByName(sourceFile, elementText);
                                const elementSourceFile = importInfo.sourceFile;
                                moduleInfo.controllers.push({
                                    controllerName: elementText,
                                    sourceFile: onlyJson ? null : elementSourceFile
                                });
                            }
                        }
                        const importsProperty = obj.getProperty("imports");
                        if (importsProperty) {
                            const elements = importsProperty.getInitializer().getElements();
                            for (const element of elements) {
                                const elementText = element.getText();
                                const importInfo = this.getImportByName(sourceFile, elementText);
                                if (importInfo) {
                                    const elementSourceFile = importInfo.sourceFile;
                                    this.scanModuleTree(elementSourceFile, moduleInfo.children, onlyJson);
                                }
                            }
                        }
                    }
                }
            }
        }
        return moduleInfos;
    }
    findDeepTreeNode(moduleInfos, path) {
        let currentNode = null;
        let currentTree = moduleInfos;
        for (const moduleName of path) {
            currentNode = currentTree.find(node => node.moduleName === moduleName);
            if (!currentNode) {
                return null;
            }
            currentTree = currentNode.children;
        }
        return currentNode;
    }
    createPrompt(moduleInfos) {
        this.promptHistory.push(moduleInfos);
        let choices = moduleInfos.map(item => item.moduleName);
        let currentTree = moduleInfos;
        let cmdSelect = new enquirer_1.CmdSelect({
            name: 'selection',
            message: chalk.yellow(t('generateSdkSelectPromptTitle')),
            choices: choices,
            onRight: (index) => {
                if (currentTree[index].children.length > 0) {
                    this.promptRoutes.push(currentTree[index].moduleName);
                    let childrenChoices = currentTree[index].children.map(item => item.moduleName);
                    cmdSelect.changeChoices(childrenChoices);
                    currentTree = currentTree[index].children;
                    this.promptHistory.push(currentTree);
                }
            },
            onLeft: () => {
                if (this.promptHistory.length > 1) {
                    this.promptRoutes.pop();
                    this.promptHistory.pop();
                    currentTree = this.promptHistory[this.promptHistory.length - 1];
                    cmdSelect.changeChoices(currentTree.map(item => item.moduleName));
                }
            }
        });
        cmdSelect.run().then((value) => {
            let moduleInfo = this.findDeepTreeNode(moduleInfos, [...this.promptRoutes, value]);
            this.parseAllControllerFile([moduleInfo]);
        }).catch((err) => {
        });
    }
    parseAllControllerFile(moduleInfos) {
        for (let moduleInfo of moduleInfos) {
            for (let controllerInfo of moduleInfo.controllers) {
                this.parseControllerFile(controllerInfo.sourceFile);
            }
            if (moduleInfo.children.length > 0) {
                this.parseAllControllerFile(moduleInfo.children);
            }
        }
    }
    parseControllerFile(sourceFile) {
        let controllerInfos = [];
        sourceFile.getClasses().forEach(classNode => {
            let controllerInfo = this.parseController(classNode);
            if (controllerInfo) {
                controllerInfos.push(controllerInfo);
            }
        });
        const groupedControllerInfos = controllerInfos.reduce((acc, controllerInfo) => {
            const { modulePath } = controllerInfo;
            if (!acc[modulePath]) {
                acc[modulePath] = [];
            }
            acc[modulePath].push(controllerInfo);
            return acc;
        }, {});
        Object.keys(groupedControllerInfos).forEach(modulePath => {
            this.generateFrontendFile(modulePath, groupedControllerInfos[modulePath]);
        });
    }
    parseController(classNode) {
        let controllerDecorator = classNode.getDecorator("Controller");
        if (!controllerDecorator) {
            return;
        }
        this.spinner = ora('Loading');
        this.spinner.color = 'blue';
        this.spinner.text = chalk.blue(t('converting') + classNode.getName());
        this.spinner.start();
        let controllerDecoArgs = this.parseDecoratorArgs(controllerDecorator);
        let routeKey = "/";
        if (controllerDecoArgs.length > 0) {
            routeKey = '/' + controllerDecoArgs[0].value;
        }
        let filePath = classNode.getSourceFile().getFilePath().replace(this.srcPath + '/', "");
        let modulePath = filePath.split('/').slice(0, -1).join('/');
        let controllerInfo = {
            className: classNode.getName(),
            filePath,
            modulePath,
            routeKey,
            methods: [],
            docs: classNode.getJsDocs().map(jsDoc => jsDoc.getStructure()),
        };
        classNode.getMethods().forEach(methodNode => {
            let methodInfo = this.parseMethod(methodNode);
            controllerInfo.methods.push(methodInfo);
        });
        return controllerInfo;
    }
    parseMethod(methodNode) {
        let restfulDecorators = new Set(["Get", "Post", "Put", "Delete", "Patch"]);
        let decorators = methodNode.getDecorators();
        let restfulDecorator = decorators.find(decorator => restfulDecorators.has(decorator.getName()));
        if (!restfulDecorator) {
            return;
        }
        let requestMethod = restfulDecorator.getName().toLowerCase();
        let routeKey = "";
        let pathArgs = this.parseDecoratorArgs(restfulDecorator);
        if (pathArgs.length > 0) {
            routeKey = pathArgs[0].value;
        }
        routeKey = routeKey.replace(/\\/g, path.sep);
        let params = [];
        methodNode.getParameters().forEach(param => {
            let paramDecorator = param.getDecorators()[0].getName();
            let paramType = this.parseType(param.getType());
            if (["Param", "Body", "Query"].includes(paramDecorator)) {
                params.push({
                    name: param.getName(),
                    type: paramType.type,
                    imports: paramType.imports,
                    flag: paramType.flag,
                    paramDecorator
                });
            }
        });
        let returnType = this.parseType(methodNode.getReturnType());
        let jsDocs = methodNode.getJsDocs().map(jsDoc => jsDoc.getStructure());
        let apiOperationDecorator = methodNode.getDecorators().find(decorator => decorator.getName() === "ApiOperation");
        if (apiOperationDecorator) {
            let apiOperationArgs = this.parseDecoratorArgs(apiOperationDecorator);
            if (apiOperationArgs[0].value.summary) {
                if (jsDocs.length > 0) {
                    jsDocs[0].description = jsDocs[0].description + '\n' + apiOperationArgs[0].value.summary;
                }
                else {
                    jsDocs.push({
                        kind: 24,
                        description: apiOperationArgs[0].value.summary,
                        tags: [],
                    });
                }
            }
        }
        return {
            methodName: methodNode.getName(),
            requestMethod,
            routeKey,
            returnType,
            params,
            jsDocs,
        };
    }
    parseDecoratorArgs(decorator, sourceFile) {
        const args = decorator.getArguments();
        const result = [];
        args.forEach(arg => {
            if (arg.getKind() === ts_morph_1.SyntaxKind.StringLiteral) {
                result.push({
                    kind: 'string',
                    value: arg.getText().slice(1, -1),
                });
            }
            else if (arg.getKind() === ts_morph_1.SyntaxKind.ObjectLiteralExpression) {
                const obj = arg;
                const objResult = {};
                obj.getProperties().forEach(prop => {
                    if (prop.getKind() == ts_morph_1.SyntaxKind.PropertyAssignment) {
                        const name = prop.getName();
                        const initializer = prop.getInitializer();
                        if (initializer) {
                            if (initializer.getKind() === ts_morph_1.SyntaxKind.StringLiteral) {
                                objResult[name] = initializer.getText().slice(1, -1);
                            }
                            else {
                                objResult[name] = initializer.getText();
                            }
                        }
                    }
                });
                result.push({
                    kind: 'object',
                    value: objResult,
                });
            }
            else if (arg.getKind() === ts_morph_1.SyntaxKind.TrueKeyword) {
                result.push({
                    kind: 'boolean',
                    value: true,
                });
            }
            else if (arg.getKind() === ts_morph_1.SyntaxKind.Identifier) {
                let importPath = "";
                if (sourceFile) {
                    let identifierName = arg.getText();
                    const importDeclaration = sourceFile.getImportDeclarations().find(importDec => importDec.getNamedImports().some(namedImport => namedImport.getName() === identifierName));
                    if (importDeclaration) {
                        importPath = importDeclaration.getModuleSpecifierValue();
                    }
                }
                result.push({
                    kind: 'identifier',
                    value: arg.getText(),
                    importPath,
                });
            }
        });
        return result;
    }
    parseType(type) {
        let result = {
            type: "",
            flag: null,
            paramName: null,
            isPromise: false,
            imports: new Map()
        };
        let typeStr = type.getText();
        let innerType = type;
        if (typeStr.startsWith("Promise<")) {
            innerType = type.getTypeArguments()[0];
            typeStr = innerType.getText();
            result.isPromise = true;
        }
        if (innerType.getText().startsWith("{")) {
            if (innerType.isArray()) {
                innerType = innerType.getArrayElementTypeOrThrow();
            }
            result.type = innerType.getText(undefined, ts_morph_1.TypeFormatFlags.OmitThisParameter);
            let symbol = innerType.getSymbol();
            if (symbol) {
                innerType.getProperties().forEach(property => {
                    const declarations = property.getDeclarations();
                    if (declarations.length > 0) {
                        const declaration = declarations[0];
                        const propertyType = declaration.getType().getText();
                        if (propertyType.startsWith("import(")) {
                            const regex = /import\("(.+)"\)\.([^\[]+)(\[\])?/;
                            const match = propertyType.match(regex);
                            if (match) {
                                const importPath = match[1];
                                const typeName = match[2];
                                const isArray = !!match[3];
                                if (importPath) {
                                    if (!result.imports.has(importPath)) {
                                        result.imports.set(importPath, new Set());
                                    }
                                    result.imports.get(importPath).add(typeName);
                                }
                            }
                        }
                    }
                });
            }
        }
        if (typeStr.startsWith("import(")) {
            let importPath = typeStr.match(/import\((.+)\)/)?.[1].slice(1, -1);
            let returnType = innerType.getText(undefined, ts_morph_1.TypeFormatFlags.OmitThisParameter);
            if (returnType?.endsWith("[]")) {
                returnType = returnType.slice(0, -2);
            }
            result.type = returnType || 'any';
            result.flag = null;
            if (importPath) {
                result.imports.set(importPath, new Set().add(returnType));
            }
        }
        else if (typeStr.startsWith("Partial<")) {
            let partialTypeMatch = type.getText().match(/Partial<(.+)>/);
            let innerType = partialTypeMatch[1];
            let importPath = innerType.match(/import\((.+)\)/)?.[1].slice(1, -1);
            let returnType = innerType.match(/\)\.(.+)/)?.[1];
            result.type = returnType || 'any';
            result.flag = "Partial";
            if (importPath) {
                result.imports.set(importPath, new Set().add(returnType));
            }
        }
        else if (typeStr.startsWith("Pick<")) {
            let innerType = type.getText();
            let match = innerType.match(/(.+),\s*"(.+)"/);
            let returnTypeStr = match ? match[1] : null;
            let importPath = returnTypeStr.match(/import\((.+)\)/)?.[1].slice(1, -1);
            let returnType = returnTypeStr.match(/\)\.(.+)/)?.[1];
            let paramName = match ? `"${match[2].replace(/\\/g, '')}"` : null;
            result.type = returnType || 'any';
            result.flag = "Pick";
            result.paramName = paramName;
            if (importPath) {
                result.imports.set(importPath, new Set().add(returnType));
            }
        }
        else if (typeStr.startsWith("Omit<")) {
            let innerType = type.getText();
            let match = innerType.match(/(.+),\s*"(.+)"/);
            let returnTypeStr = match ? match[1] : null;
            let importPath = returnTypeStr.match(/import\((.+)\)/)?.[1].slice(1, -1);
            let returnType = returnTypeStr.match(/\)\.(.+)/)?.[1];
            let paramName = match ? `"${match[2].replace(/\\/g, '')}"` : null;
            result.type = returnType || 'any';
            result.flag = "Omit";
            result.paramName = paramName;
            if (importPath) {
                result.imports.set(importPath, new Set().add(returnType));
            }
        }
        else {
            result.type = innerType.getText(undefined, ts_morph_1.TypeFormatFlags.OmitThisParameter);
            if (result.type.includes("more ...")) {
                result.type = "any";
            }
        }
        return result;
    }
    getMemberByName(sourceFile, name) {
        return sourceFile.getClasses().find(classNode => classNode.getName() === name) ||
            sourceFile.getInterfaces().find(interfaceNode => interfaceNode.getName() === name) ||
            sourceFile.getTypeAliases().find(functionNode => functionNode.getName() === name) ||
            sourceFile.getEnums().find(enumNode => enumNode.getName() === name);
    }
    getImportByName(sourceFile, importName) {
        let imports = sourceFile.getImportDeclarations();
        for (const importRow of imports) {
            let namedImports = importRow.getNamedImports();
            for (const namedImport of namedImports) {
                let name = namedImport.getName();
                let importSourceFile = importRow.getModuleSpecifierSourceFile();
                if (name == importName) {
                    return {
                        sourceFile: importSourceFile,
                        importName
                    };
                }
            }
        }
    }
    generateFrontendFile(modulePath, controllerInfos) {
        let tempProject = new ts_morph_1.Project();
        controllerInfos.forEach(controllerInfo => {
            let originalFileName = controllerInfo.filePath.split('/').pop();
            let name = originalFileName.split('.')[0];
            let tempFile = tempProject.createSourceFile(path.resolve(this.projectPath, this.config.outputPath, modulePath, name + '.ts'), undefined, { overwrite: true });
            let importMapSet = new Map();
            tempFile.addClass({
                isExported: true,
                name: controllerInfo.className,
                docs: controllerInfo.docs,
                properties: [],
                methods: controllerInfo.methods.map(methodInfo => {
                    methodInfo.params.forEach(param => {
                        if (param.imports) {
                            param.imports.forEach((typesSet, importPath) => {
                                if (importMapSet.has(importPath)) {
                                    typesSet.forEach(type => importMapSet.get(importPath).add(type));
                                }
                                else {
                                    importMapSet.set(importPath, new Set(typesSet));
                                }
                            });
                        }
                    });
                    methodInfo.returnType.imports.forEach((typesSet, importPath) => {
                        if (importMapSet.has(importPath)) {
                            typesSet.forEach(type => importMapSet.get(importPath).add(type));
                        }
                        else {
                            importMapSet.set(importPath, new Set(typesSet));
                        }
                    });
                    let urlArr = [controllerInfo.routeKey.replace(/^\//, ''), methodInfo.routeKey.replace(/^\//, '')];
                    urlArr = urlArr.filter(item => item !== '');
                    let fetchUrl = urlArr.join('/');
                    if (!methodInfo.routeKey) {
                        fetchUrl = fetchUrl.replace(/\/$/, '');
                    }
                    let paramDecorator = methodInfo.params.find(item => item.paramDecorator == 'Param');
                    if (paramDecorator && fetchUrl.includes(`:${paramDecorator.name}`)) {
                        fetchUrl = fetchUrl.replace(`:${paramDecorator.name}`, `\${${paramDecorator.name}}`);
                    }
                    let statements = `return {{HTTP_ADAPTER_NAME}}.${methodInfo.requestMethod}(\`${fetchUrl}\``;
                    let bodyDecorator = methodInfo.params.find(item => item.paramDecorator == 'Body');
                    if (bodyDecorator) {
                        statements += `,${bodyDecorator.name}`;
                    }
                    let queryDecorator = methodInfo.params.find(item => item.paramDecorator == 'Query');
                    if (queryDecorator) {
                        statements += `,{params:${queryDecorator.name}}`;
                    }
                    statements += `)`;
                    if (methodInfo.returnType.importPath) {
                        if (!importMapSet.has(methodInfo.returnType.importPath)) {
                            importMapSet.set(methodInfo.returnType.importPath, new Set());
                        }
                        importMapSet.get(methodInfo.returnType.importPath).add(methodInfo.returnType.type);
                    }
                    return {
                        docs: methodInfo.jsDocs,
                        isAsync: true,
                        isStatic: true,
                        name: methodInfo.methodName,
                        parameters: methodInfo.params,
                        returnType: `Promise<${methodInfo.returnType.type}>`,
                        statements: statements
                    };
                })
            });
            let newImportMapSet = new Map();
            importMapSet.forEach((importSet, importPath) => {
                let newTypeName = path.basename(importPath).split('.')[0] + '.d.ts';
                let typeFile = tempProject.createSourceFile(path.resolve(this.projectPath, this.config.outputPath, modulePath, 'types', newTypeName), undefined, { overwrite: true });
                newImportMapSet.set(newTypeName, importSet);
                this.generateTypeFile(typeFile, importPath, importSet);
            });
            newImportMapSet.forEach((importSet, importPath) => {
                let namedImports = Array.from(importSet).map(typeName => {
                    return typeName;
                });
                tempFile.addImportDeclaration({
                    isTypeOnly: true,
                    moduleSpecifier: './types/' + importPath,
                    namedImports
                });
            });
            tempFile.addImportDeclaration({
                moduleSpecifier: '{{HTTP_ADAPTER_PATH}}',
                defaultImport: '{{HTTP_ADAPTER_NAME}}'
            });
            tempFile.saveSync();
            if (this.spinner) {
                let lastName = this.spinner.text.split(":")[1];
                this.spinner.text = chalk.green(t('convertComplete') + lastName);
                this.spinner.succeed();
            }
        });
    }
    generateTypeFile(typeFile, importPath, importSet) {
        let tempProject = new ts_morph_1.Project();
        let targetFile;
        try {
            targetFile = tempProject.addSourceFileAtPath(importPath + '.ts');
        }
        catch (error) {
            try {
                targetFile = tempProject.addSourceFileAtPath(importPath + '.d.ts');
            }
            catch (error) {
                return;
            }
        }
        let importMapSet = new Map();
        importSet.forEach(typeName => {
            let typeNode = this.getMemberByName(targetFile, typeName);
            if (typeNode) {
                if (typeNode instanceof ts_morph_1.InterfaceDeclaration || typeNode instanceof ts_morph_1.ClassDeclaration) {
                    let extendsArr = typeNode.getBaseTypes().map(baseType => this.parseType(baseType));
                    let extend = null;
                    if (extendsArr.length > 0) {
                        extend = extendsArr[0];
                        let alreadyExist = this.getMemberByName(typeFile, extend.type);
                        if (!alreadyExist) {
                            extend.imports.forEach((typesSet, importPath) => {
                                if (importMapSet.has(importPath)) {
                                    typesSet.forEach(type => importMapSet.get(importPath).add(type));
                                }
                                else {
                                    importMapSet.set(importPath, new Set(typesSet));
                                }
                            });
                        }
                    }
                    if (extend) {
                        if (extend.flag == null) {
                            typeFile.addInterface({
                                isExported: true,
                                extends: [extend.type],
                                name: typeName,
                                docs: typeNode.getJsDocs().map(jsDoc => jsDoc.getStructure()),
                                properties: typeNode.getProperties().map(property => {
                                    let parseType = this.parseType(property.getType());
                                    parseType.imports.forEach((typesSet, importPath) => {
                                        if (importMapSet.has(importPath)) {
                                            typesSet.forEach(type => importMapSet.get(importPath).add(type));
                                        }
                                        else {
                                            importMapSet.set(importPath, new Set(typesSet));
                                        }
                                    });
                                    let jsDocs = property.getJsDocs().map(jsDoc => jsDoc.getStructure());
                                    if (property.getDecorator) {
                                        let swaggerDeco = property.getDecorator("ApiProperty");
                                        if (swaggerDeco) {
                                            let args = this.parseDecoratorArgs(swaggerDeco);
                                            if (args.length > 0) {
                                                jsDocs.push({ description: args[0].value.description });
                                            }
                                        }
                                    }
                                    let apiOperationDecorator = property.getDecorators().find(decorator => decorator.getName() === "Column");
                                    if (apiOperationDecorator) {
                                        let apiOperationArgs = this.parseDecoratorArgs(apiOperationDecorator);
                                        if (apiOperationArgs[0].value.comment) {
                                            if (jsDocs.length > 0) {
                                                jsDocs[0].description = jsDocs[0].description + '\n' + apiOperationArgs[0].value.summary;
                                            }
                                            else {
                                                jsDocs.push({
                                                    kind: 24,
                                                    description: apiOperationArgs[0].value.comment,
                                                    tags: [],
                                                });
                                            }
                                        }
                                    }
                                    return {
                                        name: property.getName(),
                                        type: parseType.type,
                                        docs: jsDocs
                                    };
                                })
                            });
                        }
                        else if (extend.flag == "Partial") {
                            typeFile.addTypeAlias({
                                isExported: true,
                                docs: typeNode.getJsDocs().map(jsDoc => jsDoc.getStructure()),
                                name: typeName,
                                type: `${extend.flag}<${extend.type}>`,
                            });
                        }
                        else if (extend.flag == "Pick" || extend.flag == "Omit") {
                            typeFile.addTypeAlias({
                                isExported: true,
                                docs: typeNode.getJsDocs().map(jsDoc => jsDoc.getStructure()),
                                name: typeName,
                                type: `${extend.flag}<${extend.type},${extend.paramName}>`,
                            });
                        }
                    }
                    else {
                        typeFile.addInterface({
                            isExported: true,
                            name: typeName,
                            docs: typeNode.getJsDocs().map(jsDoc => jsDoc.getStructure()),
                            properties: typeNode.getProperties().map(property => {
                                let parseType = this.parseType(property.getType());
                                parseType.imports.forEach((typesSet, importPath) => {
                                    if (importMapSet.has(importPath)) {
                                        typesSet.forEach(type => importMapSet.get(importPath).add(type));
                                    }
                                    else {
                                        importMapSet.set(importPath, new Set(typesSet));
                                    }
                                });
                                let jsDocs = property.getJsDocs().map(jsDoc => jsDoc.getStructure()) || [];
                                if (property.getDecorator) {
                                    let swaggerDeco = property.getDecorator("ApiProperty");
                                    if (swaggerDeco) {
                                        let args = this.parseDecoratorArgs(swaggerDeco);
                                        if (args.length > 0) {
                                            jsDocs.push({ description: args[0].value.description });
                                        }
                                    }
                                }
                                if (typeNode.getKind() === ts_morph_1.SyntaxKind.ClassDeclaration) {
                                    try {
                                        let apiOperationDecorator = property.getDecorators().find(decorator => decorator.getName() === "Column");
                                        if (apiOperationDecorator) {
                                            let apiOperationArgs = this.parseDecoratorArgs(apiOperationDecorator);
                                            if (apiOperationArgs[0].value.comment) {
                                                if (jsDocs.length > 0) {
                                                    jsDocs[0].description = jsDocs[0].description + '\n' + apiOperationArgs[0].value.summary;
                                                }
                                                else {
                                                    jsDocs.push({
                                                        kind: 24,
                                                        description: apiOperationArgs[0].value.comment,
                                                        tags: [],
                                                    });
                                                }
                                            }
                                        }
                                    }
                                    catch (error) {
                                    }
                                }
                                return {
                                    name: property.getName(),
                                    type: parseType.type,
                                    docs: jsDocs
                                };
                            })
                        });
                    }
                }
                if (typeNode instanceof ts_morph_1.TypeAliasDeclaration) {
                    typeFile.addTypeAlias(typeNode.getStructure());
                }
                if (typeNode instanceof ts_morph_1.EnumDeclaration) {
                    typeFile.addEnum(typeNode.getStructure());
                }
            }
        });
        importMapSet.forEach((importSet, importPath) => {
            this.generateTypeFile(typeFile, importPath, importSet);
        });
        typeFile.saveSync();
    }
    findNodeFromSourceTreeById(nodeId, nodes) {
        if (!nodes) {
            nodes = this.sourceTree;
        }
        for (let node of nodes) {
            if (node.nodeId === nodeId) {
                return node;
            }
            if (node.children && node.children.length > 0) {
                let foundNode = this.findNodeFromSourceTreeById(nodeId, node.children);
                if (foundNode) {
                    return foundNode;
                }
            }
            if (node.controllers && node.controllers.length > 0) {
                for (let controller of node.controllers) {
                    if (controller.nodeId === nodeId) {
                        return controller;
                    }
                    if (controller.methods && controller.methods.length > 0) {
                        for (let method of controller.methods) {
                            if (method.nodeId === nodeId) {
                                return method;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
}
exports.NestParser = NestParser;
//# sourceMappingURL=parser.js.map