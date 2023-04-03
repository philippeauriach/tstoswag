"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResponseDecorator = exports.parseRequestQueryParamsDecorator = exports.parseRequestBodyDecorator = exports.parseMethodDecorator = exports.parseTagDecorator = exports.parsePathDecorator = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const typescript_1 = __importDefault(require("typescript"));
const ts_processor_1 = require("./ts-processor");
const cleanupRawString = (str) => {
    return str.replace(/['"`]/g, '');
};
const parsePathDecorator = ({ decorator, checker }) => {
    if (!typescript_1.default.isCallExpression(decorator.expression)) {
        return {};
    }
    const type = checker.getTypeAtLocation(decorator.expression.expression);
    const symbol = type.getSymbol();
    if (symbol.escapedName === 'SwaggerPath') {
        const path = decorator.expression.arguments[0].getText().trim();
        if (path.length === 0) {
            return {};
        }
        const rawPath = cleanupRawString(path);
        //replace :paramName with {paramName}
        const pathWithBrackets = rawPath.replace(/:[a-zA-Z0-9]+/g, (match) => `{${match.replace(':', '')}}`);
        //extract parameters named {paramName}
        const paramsMatch = pathWithBrackets.match(/{[a-zA-Z0-9]+}/g);
        const params = paramsMatch?.map((param) => param.replace('{', '').replace('}', '')) ?? [];
        return { path: cleanupRawString(pathWithBrackets), pathParams: params };
    }
    return {};
};
exports.parsePathDecorator = parsePathDecorator;
const parseTagDecorator = ({ decorator, checker }) => {
    if (!typescript_1.default.isCallExpression(decorator.expression)) {
        return {};
    }
    const type = checker.getTypeAtLocation(decorator.expression.expression);
    const symbol = type.getSymbol();
    if (symbol.escapedName === 'SwaggerTag') {
        const tags = decorator.expression.arguments.map((elt) => cleanupRawString(elt.getText().trim()));
        return { tags };
    }
    return {};
};
exports.parseTagDecorator = parseTagDecorator;
const parseMethodDecorator = ({ decorator, checker }) => {
    if (!typescript_1.default.isCallExpression(decorator.expression)) {
        return {};
    }
    const type = checker.getTypeAtLocation(decorator.expression.expression);
    const symbol = type.getSymbol();
    if (symbol.escapedName === 'SwaggerMethod') {
        const firstArg = cleanupRawString(decorator.expression.arguments[0].getText());
        if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(firstArg)) {
            return { method: firstArg };
        }
    }
    return {};
};
exports.parseMethodDecorator = parseMethodDecorator;
const parseRequestBodyDecorator = ({ decorator, checker, tsconfigPath, }) => {
    if (!typescript_1.default.isCallExpression(decorator.expression)) {
        return undefined;
    }
    const type = checker.getTypeAtLocation(decorator.expression.expression);
    const symbol = type.getSymbol();
    if (symbol.escapedName !== 'SwaggerBody') {
        return undefined;
    }
    // SwaggerBody is declared as SwaggerBody<T>()
    // so we need to get the type argument from the decorator call expression
    const typeArgument = decorator.expression.typeArguments?.[0];
    if (typeArgument) {
        return (0, ts_processor_1.processUnknownParameterizedType)({ typeArgument, checker, tsconfigPath });
    }
};
exports.parseRequestBodyDecorator = parseRequestBodyDecorator;
const parseRequestQueryParamsDecorator = ({ decorator, checker, tsconfigPath, }) => {
    if (!typescript_1.default.isCallExpression(decorator.expression)) {
        return undefined;
    }
    const type = checker.getTypeAtLocation(decorator.expression.expression);
    const symbol = type.getSymbol();
    if (symbol.escapedName !== 'SwaggerQueryParams') {
        return undefined;
    }
    // SwaggerQueryParams is declared as SwaggerQueryParams<T>()
    // so we need to get the type argument from the decorator call expression
    const typeArgument = decorator.expression.typeArguments?.[0];
    if (typeArgument) {
        return (0, ts_processor_1.processUnknownParameterizedType)({ typeArgument, checker, tsconfigPath });
    }
};
exports.parseRequestQueryParamsDecorator = parseRequestQueryParamsDecorator;
const parseResponseDecorator = ({ decorator, checker, tsconfigPath, }) => {
    if (!typescript_1.default.isCallExpression(decorator.expression)) {
        return undefined;
    }
    const type = checker.getTypeAtLocation(decorator.expression.expression);
    const symbol = type.getSymbol();
    if (symbol.escapedName !== 'SwaggerResponse') {
        return undefined;
    }
    let status = 200;
    if (decorator.expression.arguments.length > 0) {
        const firstArg = decorator.expression.arguments[0];
        if (typescript_1.default.isNumericLiteral(firstArg)) {
            status = parseInt(firstArg.text, 10);
        }
    }
    // SwaggerResponse is declared as SwaggerResponse<T>()
    // so we need to get the type argument from the decorator call expression
    const typeArgument = decorator.expression.typeArguments?.[0];
    let schema;
    if (typeArgument) {
        schema = (0, ts_processor_1.processUnknownParameterizedType)({ typeArgument, checker, tsconfigPath });
    }
    return {
        status,
        typeName: schema?.typeName,
        jsonSchema: schema?.jsonSchema,
        isArray: schema?.isArray,
    };
};
exports.parseResponseDecorator = parseResponseDecorator;
