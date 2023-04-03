import { Tsoa } from '@tsoa/runtime';
import * as ts from 'typescript';
import { MetadataGenerator } from './metadataGenerator';
export declare function Extension(_name: string, _value: ExtensionType | ExtensionType[]): Function;
export type ExtensionType = string | number | boolean | null | ExtensionType[] | {
    [name: string]: ExtensionType | ExtensionType[];
};
export declare function getExtensions(decorators: ts.Identifier[], metadataGenerator: MetadataGenerator): Tsoa.Extension[];
export declare function getExtensionsFromJSDocComments(comments: string[]): Tsoa.Extension[];
