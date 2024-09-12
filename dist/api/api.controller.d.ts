import { ApiService } from './api.service';
export declare class ApiController {
    private readonly apiService;
    constructor(apiService: ApiService);
    getSourceTree(): Promise<any>;
    getCodeText(nodeId: string, targetName?: string): {
        code: any;
        start: any;
        end: any;
    };
    generateSdk(body: {
        nodeId: string;
        targetName: string;
    }): Promise<string>;
    getSdkTree(): Promise<any[]>;
    getSdkFile(filePath: string): Promise<string>;
}
