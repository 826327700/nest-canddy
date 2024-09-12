"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const common_1 = require("@nestjs/common");
const path = require("path");
const parser_service_1 = require("../parser/parser.service");
const runtime_config_1 = require("../runtime.config");
const ts_morph_1 = require("ts-morph");
const fs = require("fs");
let ApiService = class ApiService {
    constructor(parserService) {
        this.parserService = parserService;
    }
    async getSourceTree() {
        return this.parserService.parser.getProjectTree();
    }
    getCodeText(nodeId, targetName) {
        let node = this.parserService.parser.findNodeFromSourceTreeById(nodeId);
        if (node) {
            const sourceFile = node.sourceFile;
            const code = sourceFile.getFullText();
            let start, end;
            if (targetName) {
                const targetNode = sourceFile.getDescendants().find(descendant => (descendant.getKind() === ts_morph_1.SyntaxKind.ClassDeclaration || descendant.getKind() === ts_morph_1.SyntaxKind.MethodDeclaration) &&
                    descendant.getName() === targetName);
                if (targetNode) {
                    const startPos = targetNode.getStart();
                    const endPos = targetNode.getEnd();
                    start = sourceFile.getLineAndColumnAtPos(startPos);
                    end = sourceFile.getLineAndColumnAtPos(endPos);
                }
                else {
                    throw new Error("Target not found");
                }
            }
            else {
                const lastLine = sourceFile.getEndLineNumber();
                const lastColumn = sourceFile.getFullText().split('\n').pop()?.length || 0;
                start = { line: lastLine, column: lastColumn };
                end = { line: lastLine, column: lastColumn };
            }
            return {
                code,
                start,
                end
            };
        }
        else {
            throw new Error("Node not found");
        }
    }
    async generateSdk(body) {
        let node = this.parserService.parser.findNodeFromSourceTreeById(body.nodeId);
        if (node) {
            const buildSdk = (nodeItem) => {
                if (nodeItem.moduleName) {
                    for (let controllerInfo of nodeItem.controllers) {
                        this.parserService.parser.parseControllerFile(controllerInfo.sourceFile);
                    }
                    if (nodeItem.children) {
                        for (let child of nodeItem.children) {
                            buildSdk(child);
                        }
                    }
                }
                if (nodeItem.controllerName) {
                    this.parserService.parser.parseControllerFile(nodeItem.sourceFile);
                }
            };
            buildSdk(node);
        }
        return 'ok';
    }
    async getSdkTree() {
        let sdkPath = path.resolve(runtime_config_1.runtimeConfig.projectPath, this.parserService.parser.config.outputPath);
        const readDirectory = (dirPath, parentPath = '') => {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            const result = [];
            let latestModified = new Date(0);
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const stats = fs.statSync(fullPath);
                let lastModified = new Date(stats.mtime);
                if (entry.isDirectory()) {
                    const children = readDirectory(fullPath, path.join(parentPath, entry.name));
                    const latestChildModified = children.reduce((latest, child) => {
                        return new Date(child.lastModified) > latest ? new Date(child.lastModified) : latest;
                    }, new Date(0));
                    lastModified = latestChildModified > lastModified ? latestChildModified : lastModified;
                    result.push({
                        name: entry.name,
                        type: 'directory',
                        relativePath: path.join(parentPath, entry.name),
                        fullPath: path.join(sdkPath, parentPath, entry.name),
                        lastModified: lastModified.toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        }).replace(/\//g, '-').replace(',', ''),
                        children
                    });
                }
                else {
                    result.push({
                        name: entry.name,
                        type: 'file',
                        fullPath: path.join(sdkPath, parentPath, entry.name),
                        relativePath: path.join(parentPath, entry.name),
                        lastModified: lastModified.toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        }).replace(/\//g, '-').replace(',', '')
                    });
                }
                if (lastModified > latestModified) {
                    latestModified = lastModified;
                }
            }
            return result;
        };
        const sdkTree = readDirectory(sdkPath);
        return sdkTree;
    }
    async getSdkFile(filePath) {
        let file = fs.readFileSync(filePath, 'utf8');
        return file;
    }
};
exports.ApiService = ApiService;
exports.ApiService = ApiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [parser_service_1.ParserService])
], ApiService);
//# sourceMappingURL=api.service.js.map