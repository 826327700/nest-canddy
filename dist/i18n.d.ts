declare const osLocale: any;
declare const messages: {
    en: {
        loading: string;
        projectPath: string;
        scanning: string;
        scanComplete: string;
        noTsConfig: string;
        converting: string;
        convertComplete: string;
        generateSdkSelectPromptTitle: string;
        getSdkSelectPromptTitle: string;
        updateAt: string;
        downloaded: string;
    };
    zh: {
        loading: string;
        projectPath: string;
        scanning: string;
        scanComplete: string;
        noTsConfig: string;
        converting: string;
        convertComplete: string;
        generateSdkSelectPromptTitle: string;
        getSdkSelectPromptTitle: string;
        updateAt: string;
        downloaded: string;
    };
};
declare let currentLocale: string;
declare function initLocale(): Promise<void>;
declare function t(key: any): any;
