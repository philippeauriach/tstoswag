import ts from 'typescript';
import { JSONSchema, ParsedMethod } from '../types';
export declare const parseClass: (node: ts.Node, checker: ts.TypeChecker, allSchemas: JSONSchema, tsconfigPath: string) => {
    methods: ParsedMethod[];
    allSchemas: JSONSchema;
};
export declare const parseMethod: (node: ts.Node, checker: ts.TypeChecker, allSchemas: JSONSchema, tsconfigPath: string) => {
    parsedMethod: ParsedMethod;
    allSchemas: JSONSchema;
} | undefined;
export declare const processTypeWithJsonSchemaGenerator: ({ filePath, tsconfigPath, typeName, }: {
    filePath: string;
    tsconfigPath?: string | undefined;
    typeName: string;
}) => import("json-schema").JSONSchema7 | undefined;
export declare const processUnknownParameterizedType: ({ typeArgument, checker, tsconfigPath, }: {
    typeArgument: ts.TypeNode;
    checker: ts.TypeChecker;
    tsconfigPath: string;
}) => {
    typeName: (string & {
        __escapedIdentifier: void;
    }) | ts.InternalSymbolName;
    isArray: boolean;
    jsonSchema: import("json-schema").JSONSchema7 | undefined;
};
