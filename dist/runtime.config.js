"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtimeConfig = void 0;
exports.runtimeConfig = {
    projectPath: process.argv.find(arg => arg.startsWith('-p='))?.split('=')[1] || process.cwd()
};
//# sourceMappingURL=runtime.config.js.map