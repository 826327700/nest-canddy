#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const enquirer_1 = require("./enquirer");
const { program } = require('commander');
const pkg = require('../../package.json');
const chalk = require('chalk');
const axios = require('axios');
const { initLocale, t } = require('../i18n');
class ClientCli {
    constructor(args) {
        this.options = {
            host: 'localhost:13270',
            outputPath: './output',
            httpAdapterPath: 'axios',
            httpAdapterName: 'axios'
        };
        this.promptHistory = [];
        this.filesTree = [];
        this.options = Object.assign(this.options, args);
    }
    async getSdkStart() {
        this.filesTree = await this.getBackendFilesTree();
        let currentTree = this.filesTree;
        this.promptHistory.push(this.filesTree);
        let createChoices = (arr) => {
            return arr.map(item => {
                return {
                    type: item.type,
                    name: item.name,
                    hint: t('updateAt') + item.lastModified,
                    value: item.fullPath
                };
            });
        };
        let choices = createChoices(this.filesTree);
        let cmdSelect = new enquirer_1.CmdSelect({
            name: 'selection',
            message: chalk.yellow(t('getSdkSelectPromptTitle')),
            choices: choices,
            onRight: (index) => {
                if (currentTree[index].children && currentTree[index].children.length > 0) {
                    let childrenChoices = createChoices(currentTree[index].children);
                    cmdSelect.changeChoices(childrenChoices);
                    currentTree = currentTree[index].children;
                    this.promptHistory.push(currentTree);
                }
            },
            onLeft: () => {
                if (this.promptHistory.length > 1) {
                    this.promptHistory.pop();
                    currentTree = this.promptHistory[this.promptHistory.length - 1];
                    cmdSelect.changeChoices(createChoices(currentTree));
                }
            }
        });
        cmdSelect.run().then((value) => {
            let node = this.findDeepTreeNode(this.filesTree, cmdSelect.focused.value);
            if (node) {
                this.handleTreeNode(node);
            }
        }).catch((err) => {
        });
    }
    async getBackendFilesTree() {
        const url = this.options.host;
        const res = await axios.get(`http://${url}/api/sdk-tree`);
        return res.data;
    }
    findDeepTreeNode(arr, fullPath) {
        for (let item of arr) {
            if (item.fullPath === fullPath) {
                return item;
            }
            if (item.children) {
                let found = this.findDeepTreeNode(item.children, fullPath);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
    handleTreeNode(node) {
        if (node.type === 'file') {
            this.downloadSdk(node);
        }
        else if (node.type === 'directory') {
            node.children.forEach(item => this.handleTreeNode(item));
        }
    }
    async downloadSdk(item) {
        const res = await axios.get(`http://${this.options.host}/api/sdk-file?filePath=${item.fullPath}`, { responseType: 'text' });
        let fileContent = res.data;
        fileContent = fileContent.replace(/{{HTTP_ADAPTER_NAME}}/g, this.options.httpAdapterName);
        fileContent = fileContent.replace(/{{HTTP_ADAPTER_PATH}}/g, this.options.httpAdapterPath);
        const savePath = path.resolve(process.cwd(), this.options.outputPath, item.relativePath);
        const saveDir = path.dirname(savePath);
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }
        fs.writeFileSync(savePath, fileContent);
        console.log(chalk.blue(savePath), chalk.green(t('downloaded')));
    }
}
program.name('nestc').version(pkg.version);
program
    .command('get')
    .alias('g')
    .description('Get ts sdk files')
    .option('-h, --host <host>', 'Specify the host of the project')
    .action(async (args) => {
    await initLocale();
    const configPath = path.resolve(process.cwd(), 'nestcanddy.config.cjs');
    if (fs.existsSync(configPath)) {
        const config = require(configPath);
        if (args.host && config?.client?.host) {
            config.client.host = args.host;
        }
        new ClientCli(config?.client || {}).getSdkStart();
    }
    else {
        console.log(chalk.red('No nestcanddy.config.cjs file found in the current directory'));
    }
});
program.parse(process.argv);
//# sourceMappingURL=client-cli.js.map