#!/usr/bin/env node
import { SourceFile } from 'ts-morph';
export declare class NestParser {
    private project;
    private srcPath;
    private projectPath;
    private promptHistory;
    private promptRoutes;
    private spinner;
    sourceTree: any[];
    config: any;
    constructor();
    initConfig(projectPath?: string): Promise<void>;
    getProjectTree(): any;
    start(): Promise<void>;
    private scanProjectTree;
    private scanModuleTree;
    private findDeepTreeNode;
    private createPrompt;
    private parseAllControllerFile;
    parseControllerFile(sourceFile: SourceFile): void;
    private parseController;
    private parseMethod;
    private parseDecoratorArgs;
    private parseType;
    private getMemberByName;
    private getImportByName;
    private generateFrontendFile;
    private generateTypeFile;
    findNodeFromSourceTreeById(nodeId: any, nodes?: any[]): any;
}
