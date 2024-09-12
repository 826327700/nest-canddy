import { ParserService } from 'src/parser/parser.service';
export declare class ApiService {
    private readonly parserService;
    constructor(parserService: ParserService);
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
