import { Tsoa } from '@tsoa/runtime';
import * as ts from 'typescript';
import { MetadataGenerator } from './metadataGenerator';
export declare class MethodGenerator {
    private readonly node;
    private readonly current;
    private readonly commonResponses;
    private readonly parentPath?;
    private readonly parentTags?;
    private readonly parentSecurity?;
    private readonly isParentHidden?;
    private method?;
    private path;
    private produces?;
    private consumes?;
    constructor(node: ts.MethodDeclaration, current: MetadataGenerator, commonResponses: Array<Tsoa.Response & {
        status: number;
    }>, parentPath?: string | undefined, parentTags?: string[] | undefined, parentSecurity?: Tsoa.Security[] | undefined, isParentHidden?: boolean | undefined);
    IsValid(): boolean;
    Generate(): Tsoa.Method;
    private getExtensions;
    private getCurrentLocation;
    private processMethodDecorators;
    private getMethodResponses;
    private schemaToParameter;
    private getParameters;
    private getPathParameters;
    private getHeadersFromDecorator;
    private getSchemaFromDecorator;
    private getIsDeprecated;
    private getOperationId;
    private getTags;
    private getSecurity;
    private getIsHidden;
    private getDecoratorsByIdentifier;
    private getProducesAdapter;
}
