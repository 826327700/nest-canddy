"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const runtime_config_1 = require("./runtime.config");
var figlet = require("figlet");
const chalk = require('chalk');
async function bootstrap(projectPath) {
    runtime_config_1.runtimeConfig.projectPath = projectPath || process.cwd();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error']
    });
    app.enableCors();
    await app.listen(13270);
    const figlet_data = await figlet("NEST CANDDY");
    console.log(chalk.green(figlet_data));
    const localIp = require('os').networkInterfaces();
    const ip = Object.values(localIp).flat().find((details) => details.family === 'IPv4' && !details.internal)?.address;
    console.log(chalk.blue(`Server is running on http://${ip}:13270`));
    console.log(chalk.blue(`Web UI is running on http://${ip}:13270/ui`));
}
//# sourceMappingURL=start-server.js.map