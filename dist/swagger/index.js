"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSwagger = void 0;
const transformers_1 = require("./transformers");
const generateSwagger = ({ methods, schema, info, }) => {
    const methodsGroupedByPath = methods.reduce((acc, method) => {
        if (!method.path) {
            return acc;
        }
        if (!acc[method.path]) {
            acc[method.path] = [];
        }
        acc[method.path].push(method);
        return acc;
    }, {});
    const document = {
        openapi: '3.1.0',
        info: {
            title: 'API',
            version: '1.0.0',
            description: 'API',
            ...info,
        },
        paths: Object.entries(methodsGroupedByPath).reduce((acc, [path, methods]) => {
            acc[path] = methods.reduce((acc, method) => {
                if (!method.method) {
                    return acc;
                }
                acc[method.method.toLowerCase()] = {
                    //TODO: find a way to pass summary and description from jsdoc ?
                    // summary: '',
                    // description: '',
                    tags: method.tags,
                    parameters: [
                        ...(0, transformers_1.generatePathParams)(method.pathParams),
                        ...(0, transformers_1.generateQueryParams)(method.requestQueryParams, schema),
                    ],
                    requestBody: (0, transformers_1.generateRequestBody)(method.requestBody),
                    responses: (0, transformers_1.generateResponses)(method.responses),
                };
                return acc;
            }, {});
            return acc;
        }, {}),
        components: {
            schemas: (0, transformers_1.generateSwaggerSchemas)(schema),
        },
    };
    return document;
};
exports.generateSwagger = generateSwagger;
