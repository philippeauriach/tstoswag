import ts from 'typescript';
import { JSONSchema } from '../types';
type ParseDecoratorOptions = {
    decorator: ts.Decorator;
    checker: ts.TypeChecker;
    tsconfigPath: string;
};
export declare const parsePathDecorator: ({ decorator, checker }: ParseDecoratorOptions) => {
    path?: undefined;
    pathParams?: undefined;
} | {
    path: string;
    pathParams: string[];
};
export declare const parseTagDecorator: ({ decorator, checker }: ParseDecoratorOptions) => {
    tags?: undefined;
} | {
    tags: string[];
};
export declare const parseMethodDecorator: ({ decorator, checker }: ParseDecoratorOptions) => {
    method?: undefined;
} | {
    method: string;
};
export declare const parseRequestBodyDecorator: ({ decorator, checker, tsconfigPath, }: ParseDecoratorOptions) => {
    typeName?: string;
    isArray?: boolean;
    jsonSchema?: JSONSchema;
} | undefined;
export declare const parseRequestQueryParamsDecorator: ({ decorator, checker, tsconfigPath, }: ParseDecoratorOptions) => {
    typeName?: string;
    isArray?: boolean;
    jsonSchema?: JSONSchema;
} | undefined;
export declare const parseResponseDecorator: ({ decorator, checker, tsconfigPath, }: ParseDecoratorOptions) => {
    status: number;
    typeName?: string | undefined;
    isArray?: boolean | undefined;
    jsonSchema?: import("json-schema").JSONSchema7 | undefined;
} | undefined;
export {};
