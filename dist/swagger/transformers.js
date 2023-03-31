"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSwaggerSchemas = exports.getSwaggerSchemaFromDefinition = exports.schemaPropertyToOpenAPIV3Property = exports.generateResponses = exports.generateRequestBody = exports.generateQueryParams = exports.generatePathParams = void 0;
const utils_1 = require("./utils");
const generatePathParams = (pathParams) => {
    if (!pathParams) {
        return [];
    }
    return pathParams.map((param) => ({
        name: param,
        in: 'path',
        required: true,
        schema: { type: 'string' },
    }));
};
exports.generatePathParams = generatePathParams;
const generateQueryParams = (queryParam, schema) => {
    if (!queryParam) {
        return [];
    }
    // find ref in schema
    const ref = schema.definitions?.[queryParam.ref];
    if (!ref) {
        console.error(`Could not find ref ${queryParam.ref} in schema`);
        return [];
        // throw new Error(`Could not find ref ${queryParam.ref} in schema`)
    }
    // if ref is an array, return an array of ref
    if (typeof ref === 'boolean') {
        return [];
    }
    if (!ref.properties) {
        console.error(`Could not find properties in ref ${queryParam.ref} in schema - for query param`);
        return [];
    }
    return Object.entries(ref.properties).map(([key, property]) => {
        if (typeof property === 'boolean') {
            throw new Error("Property can't be a boolean");
        }
        const swaggerProperty = (0, exports.schemaPropertyToOpenAPIV3Property)(property);
        return {
            name: key,
            in: 'query',
            required: ref.required?.includes(key) ?? false,
            schema: swaggerProperty,
        };
    });
};
exports.generateQueryParams = generateQueryParams;
const generateRequestBody = (requestBody) => {
    if (!requestBody) {
        return undefined;
    }
    return {
        content: {
            'application/json': {
                schema: requestBody.isArray
                    ? { type: 'array', items: { $ref: `#/components/schemas/${requestBody.ref}` } }
                    : { $ref: `#/components/schemas/${requestBody.ref}` },
            },
        },
    };
};
exports.generateRequestBody = generateRequestBody;
const generateResponses = (responses) => {
    if (!responses) {
        return {};
    }
    return Object.entries(responses).reduce((acc, [code, response]) => {
        acc[`${response.status}`] = {
            //TODO: find a way to pass description from jsdoc ?
            description: (0, utils_1.defaultResponseDescriptionFromCode)(code) ?? '',
            content: response.ref
                ? {
                    'application/json': response.isArray
                        ? { schema: { type: 'array', items: { $ref: `#/components/schemas/${response.ref}` } } }
                        : { schema: { $ref: `#/components/schemas/${response.ref}` } },
                }
                : undefined,
        };
        return acc;
    }, {});
};
exports.generateResponses = generateResponses;
const schemaPropertyToOpenAPIV3Property = (property) => {
    if (!property) {
        return undefined;
    }
    if (property.type === 'array') {
        const subArray = (0, exports.schemaPropertyToOpenAPIV3Property)(property.items);
        if (!subArray) {
            return undefined;
        }
        return {
            type: 'array',
            items: subArray,
        };
    }
    if (property.type === 'object') {
        return {
            type: 'object',
            properties: Object.entries(property.properties ?? {}).reduce((acc, [name, property]) => {
                if (typeof property === 'boolean') {
                    return acc;
                }
                acc[name] = property;
                return acc;
            }, {}),
        };
    }
    if (property.type === 'string' ||
        property.type === 'number' ||
        property.type === 'boolean' ||
        property.type === 'integer') {
        if (property.enum) {
            return { type: property.type, enum: property.enum };
        }
        if (property.const) {
            return { type: property.type, enum: [property.const] };
        }
        return { type: property.type };
    }
    if (property.$ref) {
        return { $ref: property.$ref.replace('#/definitions/', '#/components/schemas/') };
    }
    console.error('property not handled yet, ignoring', property);
};
exports.schemaPropertyToOpenAPIV3Property = schemaPropertyToOpenAPIV3Property;
const getSwaggerSchemaFromDefinition = (definition) => {
    if (typeof definition === 'boolean') {
        return undefined;
    }
    if (definition.$ref) {
        return { $ref: definition.$ref.replace('#/definitions/', '#/components/schemas/') };
    }
    if (definition.type === 'array') {
        const subArray = (0, exports.getSwaggerSchemaFromDefinition)(definition.items);
        if (!subArray) {
            return undefined;
        }
        return {
            type: 'array',
            items: subArray,
        };
    }
    if (definition.type === 'object') {
        return {
            type: 'object',
            required: definition.required,
            properties: Object.entries(definition.properties ?? {}).reduce((acc, [name, property]) => {
                if (typeof property === 'boolean') {
                    return acc;
                }
                const swaggerProperty = (0, exports.schemaPropertyToOpenAPIV3Property)(property);
                if (swaggerProperty) {
                    acc[name] = swaggerProperty;
                }
                return acc;
            }, {}),
        };
    }
    if (definition.anyOf) {
        return {
            anyOf: definition.anyOf
                .map(exports.getSwaggerSchemaFromDefinition)
                .filter((x) => !!x),
        };
    }
    if (definition.oneOf) {
        return {
            oneOf: definition.oneOf
                .map(exports.getSwaggerSchemaFromDefinition)
                .filter((x) => !!x),
        };
    }
    if (definition.allOf) {
        return {
            allOf: definition.allOf
                .map(exports.getSwaggerSchemaFromDefinition)
                .filter((x) => !!x),
        };
    }
    console.error('unhandled definition', definition);
    return {};
};
exports.getSwaggerSchemaFromDefinition = getSwaggerSchemaFromDefinition;
const generateSwaggerSchemas = (schema) => {
    if (!schema.definitions) {
        return {};
    }
    return Object.entries(schema.definitions).reduce((acc, [name, definition]) => {
        const schemaFromDef = (0, exports.getSwaggerSchemaFromDefinition)(definition);
        if (schemaFromDef) {
            acc[name] = schemaFromDef;
        }
        return acc;
    }, {});
};
exports.generateSwaggerSchemas = generateSwaggerSchemas;
