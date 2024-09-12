const { osLocale } = require("os-locale-s");
const messages = {
    en: {
        loading: 'Loading...',
        projectPath: 'Project Path',
        scanning: 'Scanning...',
        scanComplete: 'Scan complete',
        noTsConfig: 'No tsconfig.json file found in the current directory',
        converting: 'Converting: ',
        convertComplete: 'Convert complete: ',
        generateSdkSelectPromptTitle: 'Please select the module to start building (press → to enter the sub-module, press ← to return to the parent module, press Enter to confirm):',
        getSdkSelectPromptTitle: 'Please select the module or file to pull (press → to enter the sub-module, press ← to return to the parent module, press Enter to confirm):',
        updateAt: 'UpdateAt:',
        downloaded: 'downloaded',
    },
    zh: {
        loading: '加载中...',
        projectPath: '项目路径',
        scanning: '正在扫描项目',
        scanComplete: '扫描完成',
        noTsConfig: '当前目录下未找到 tsconfig.json 文件',
        converting: '正在转换: ',
        convertComplete: '转换完成: ',
        generateSdkSelectPromptTitle: '请选择模块开始构建 (按→进入子模块，按←返回上级，按回车键确认):',
        getSdkSelectPromptTitle: '请选择需要拉取的模块或文件 (按→进入子模块，按←返回上级，按回车键确认):',
        updateAt: '更新于:',
        downloaded: '下载完成',
    }
};
let currentLocale = 'zh';
async function initLocale() {
    const locale = await osLocale();
    if (locale.startsWith('zh')) {
        currentLocale = 'zh';
    }
    else {
        currentLocale = 'en';
    }
}
function t(key) {
    return messages[currentLocale][key] || key;
}
module.exports = {
    initLocale,
    t
};
//# sourceMappingURL=i18n.js.map