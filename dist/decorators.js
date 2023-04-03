"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerResponse = exports.SwaggerOperationId = exports.SwaggerBody = exports.SwaggerQueryParams = exports.SwaggerMethod = exports.SwaggerTag = exports.SwaggerPath = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * can be used as a decorator on a class or a method
 * Parameters will be generated from the url when written as `:id`
 * @param path the path of the endpoint
 */
function SwaggerPath(path) {
    return function (target, propertyKey, descriptor) {
        return descriptor?.value ?? target;
    };
}
exports.SwaggerPath = SwaggerPath;
/**
 * can be used as a decorator on a class or a method
 */
function SwaggerTag(...tag) {
    return function (target, propertyKey, descriptor) {
        return descriptor?.value ?? target;
    };
}
exports.SwaggerTag = SwaggerTag;
function SwaggerMethod(method) {
    return function (target, propertyKey, descriptor) {
        return descriptor?.value ?? target;
    };
}
exports.SwaggerMethod = SwaggerMethod;
function SwaggerQueryParams() {
    return function (target, propertyKey, descriptor) {
        return descriptor.value;
    };
}
exports.SwaggerQueryParams = SwaggerQueryParams;
function SwaggerBody() {
    return function (target, propertyKey, descriptor) {
        return descriptor.value;
    };
}
exports.SwaggerBody = SwaggerBody;
function SwaggerOperationId(operationId) {
    return function (target, propertyKey, descriptor) {
        return descriptor.value;
    };
}
exports.SwaggerOperationId = SwaggerOperationId;
function SwaggerResponse(status = 200, description) {
    return function (target, propertyKey, descriptor) {
        return descriptor?.value ?? target;
    };
}
exports.SwaggerResponse = SwaggerResponse;
