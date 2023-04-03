import { Tsoa } from '@tsoa/runtime';
import * as ts from 'typescript';
import type { CompilerOptions } from 'typescript';
import { Config } from './config';
import { ExtendedSpecConfig } from './types';
export declare const getSwaggerOutputPath: (swaggerConfig: ExtendedSpecConfig) => string;
export declare const generateSpec: (swaggerConfig: ExtendedSpecConfig, compilerOptions?: ts.CompilerOptions, ignorePaths?: string[], metadata?: Tsoa.Metadata) => Promise<Tsoa.Metadata>;
export declare const validateSpecConfig: (config: Config) => Promise<ExtendedSpecConfig>;
export declare const runSpecGeneration: (args: {
    configuration?: string | Config;
    basePath?: string;
    host?: string;
}) => Promise<void>;
