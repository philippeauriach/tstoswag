import { Schema } from 'ts-json-schema-generator';
export type JSONSchema = Schema;
export type ParsedMethod = {
    method?: string;
    path?: string;
    pathParams?: string[];
    requestQueryParams?: {
        ref: string;
        isArray?: boolean;
    };
    requestBody?: {
        ref: string;
        isArray?: boolean;
    };
    responses?: {
        status: number;
        ref?: string;
        isArray?: boolean;
    }[];
    tags?: string[];
};
