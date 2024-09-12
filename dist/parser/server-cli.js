#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const start_server_1 = require("../start-server");
const parser_1 = require("./parser");
const { program } = require('commander');
const pkg = require('../../package.json');
program.name('nests').version(pkg.version);
program
    .command('generate')
    .alias('g')
    .description('Generate frontend files')
    .option('-p, --path <protject_path>', 'Specify the path of the project')
    .action(async (args) => {
    const parser = new parser_1.NestParser();
    await parser.initConfig(args.path);
    parser.start();
});
program
    .command('server')
    .alias('s')
    .description('Start the server')
    .option('-p, --path <protject_path>', 'Specify the path of the project')
    .action((args) => {
    (0, start_server_1.bootstrap)(args.path);
});
program.parse(process.argv);
//# sourceMappingURL=server-cli.js.map