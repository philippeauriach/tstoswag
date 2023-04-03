"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUnknownParameterizedType = exports.processTypeWithJsonSchemaGenerator = exports.parseMethod = exports.parseClass = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const ts_json_schema_generator_1 = require("ts-json-schema-generator");
const typescript_1 = __importDefault(require("typescript"));
const decoratorsParser_1 = require("./decoratorsParser");
const cacheByFilePath = new Map();
const parseClass = (node, checker, allSchemas, tsconfigPath) => {
    if (!typescript_1.default.isClassDeclaration(node)) {
        return { methods: [], allSchemas };
    }
    const classData = {};
    // first, check if the class has a SwaggerPath or SwaggerTag decorator
    const decorators = typescript_1.default.getDecorators(node);
    decorators?.forEach((decorator) => {
        const { path, pathParams } = (0, decoratorsParser_1.parsePathDecorator)({ decorator, checker, tsconfigPath });
        if (path) {
            classData.mainPath = path;
            classData.mainPathParams = pathParams;
        }
        const { tags } = (0, decoratorsParser_1.parseTagDecorator)({ decorator, checker, tsconfigPath });
        if (tags) {
            classData.tags = tags;
        }
    });
    const updatedAllSchemas = { ...allSchemas };
    const results = [];
    // list all methods and check if they have a SwaggerMethod decorator
    typescript_1.default.forEachChild(node, (node) => {
        if (typescript_1.default.isMethodDeclaration(node)) {
            const { parsedMethod, allSchemas: newAllSchemas } = (0, exports.parseMethod)(node, checker, updatedAllSchemas, tsconfigPath) ?? {};
            if (newAllSchemas) {
                updatedAllSchemas.definitions = {
                    ...updatedAllSchemas.definitions,
                    ...newAllSchemas.definitions,
                };
            }
            if (parsedMethod) {
                if (!parsedMethod.path && !classData.mainPath) {
                    console.log('Missing path for method', parsedMethod);
                    return;
                    //throw new Error('No path found for method')
                }
                if (classData.mainPath) {
                    parsedMethod.path = (classData.mainPath ?? '') + (parsedMethod.path ?? '');
                    parsedMethod.pathParams = (classData.mainPathParams ?? []).concat(parsedMethod.pathParams ?? []);
                }
                if (classData.tags) {
                    parsedMethod.tags = (classData.tags ?? []).concat(parsedMethod.tags ?? []);
                }
                results.push(parsedMethod);
            }
        }
    });
    return { methods: results, allSchemas: updatedAllSchemas };
};
exports.parseClass = parseClass;
const parseMethod = (node, checker, allSchemas, tsconfigPath) => {
    if (!typescript_1.default.isMethodDeclaration(node)) {
        return;
    }
    // first, check if the class has a SwaggerPath decorator
    const decorators = typescript_1.default.getDecorators(node);
    let result = {};
    decorators?.forEach((decorator) => {
        const opts = { decorator, checker, tsconfigPath };
        const pathData = (0, decoratorsParser_1.parsePathDecorator)(opts);
        const methodData = (0, decoratorsParser_1.parseMethodDecorator)(opts);
        const requestQueryParamsData = (0, decoratorsParser_1.parseRequestQueryParamsDecorator)(opts);
        const requestBodyData = (0, decoratorsParser_1.parseRequestBodyDecorator)(opts);
        const responseData = (0, decoratorsParser_1.parseResponseDecorator)(opts);
        const tagData = (0, decoratorsParser_1.parseTagDecorator)(opts);
        allSchemas.definitions = {
            ...allSchemas.definitions,
            ...requestQueryParamsData?.jsonSchema?.definitions,
            ...requestBodyData?.jsonSchema?.definitions,
            ...responseData?.jsonSchema?.definitions,
        };
        if (requestQueryParamsData?.typeName) {
            result.requestQueryParams = { ref: requestQueryParamsData.typeName, isArray: requestQueryParamsData.isArray };
        }
        if (requestBodyData?.typeName) {
            result.requestBody = { ref: requestBodyData.typeName, isArray: requestBodyData.isArray };
        }
        if (responseData?.status) {
            result.responses = result.responses ?? [];
            result.responses.push({ status: responseData.status, ref: responseData.typeName, isArray: responseData.isArray });
        }
        result = {
            ...result,
            ...pathData,
            ...methodData,
            ...tagData,
        };
    });
    return {
        parsedMethod: result,
        allSchemas,
    };
};
exports.parseMethod = parseMethod;
const processTypeWithJsonSchemaGenerator = ({ filePath, tsconfigPath, typeName, }) => {
    const config = {
        path: filePath,
        tsconfig: tsconfigPath,
        type: typeName,
        expose: 'all',
    };
    const cacheKey = `${filePath}-${typeName}`;
    if (cacheByFilePath.has(cacheKey)) {
        return cacheByFilePath.get(cacheKey);
    }
    const res = (0, ts_json_schema_generator_1.createGenerator)(config).createSchema(config.type);
    cacheByFilePath.set(cacheKey, res);
    return res;
};
exports.processTypeWithJsonSchemaGenerator = processTypeWithJsonSchemaGenerator;
const processUnknownParameterizedType = ({ typeArgument, checker, tsconfigPath, }) => {
    let isArray = false;
    let type = checker.getTypeAtLocation(typeArgument);
    let rawType = checker.typeToString(type);
    let shouldProcess = rawType === type.aliasSymbol?.escapedName;
    let typeName = type.aliasSymbol?.escapedName;
    // handle T[] type
    if (typeArgument.kind === typescript_1.default.SyntaxKind.ArrayType) {
        isArray = true;
        const arrayType = typeArgument;
        type = checker.getTypeAtLocation(arrayType.elementType);
    }
    // handle Array<T> type
    if (typeArgument.kind === typescript_1.default.SyntaxKind.TypeReference) {
        const typeReference = typeArgument;
        const identifier = typeReference.typeName;
        if (typeReference.typeName.kind === typescript_1.default.SyntaxKind.Identifier && identifier.escapedText === 'Array') {
            isArray = true;
            type = checker.getTypeAtLocation(typeReference.typeArguments[0]);
            typeName = type.aliasSymbol?.escapedName;
            rawType = checker.typeToString(type);
            shouldProcess = rawType === typeName;
        }
    }
    if (shouldProcess && typeName) {
        // true type usable by json-schema-generator
        return {
            typeName,
            isArray,
            jsonSchema: (0, exports.processTypeWithJsonSchemaGenerator)({
                filePath: typeArgument.getSourceFile().fileName,
                typeName: rawType,
                tsconfigPath,
            }),
        };
    }
    // unknown type, we need to process it ourselves
    console.log('Unsuported type', type.aliasSymbol?.escapedName, rawType, typeName, `kind= ${typeArgument.kind}`);
    throw new Error('This type is not supported yet!');
};
exports.processUnknownParameterizedType = processUnknownParameterizedType;
