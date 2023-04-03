"use strict";
/* eslint-disable @typescript-eslint/prefer-optional-chain */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodGenerator = void 0;
const ts = __importStar(require("typescript"));
const decoratorUtils_1 = require("./decoratorUtils");
const exceptions_1 = require("./exceptions");
const extension_1 = require("./extension");
const headerTypeHelpers_1 = require("./headerTypeHelpers");
const jsDocUtils_1 = require("./jsDocUtils");
const typeResolver_1 = require("./typeResolver");
class MethodGenerator {
    constructor(node, current, commonResponses, parentPath, parentTags, parentSecurity, isParentHidden) {
        this.node = node;
        this.current = current;
        this.commonResponses = commonResponses;
        this.parentPath = parentPath;
        this.parentTags = parentTags;
        this.parentSecurity = parentSecurity;
        this.isParentHidden = isParentHidden;
        this.path = '/';
        this.processMethodDecorators();
    }
    IsValid() {
        return !!this.method;
    }
    Generate() {
        if (!this.IsValid()) {
            throw new exceptions_1.GenerateMetadataError("This isn't a valid a controller method.");
        }
        console.log('Generating', this.method, this.parentPath, this.path);
        let nodeType = this.node.type;
        if (!nodeType) {
            const typeChecker = this.current.typeChecker;
            const signature = typeChecker.getSignatureFromDeclaration(this.node);
            const implicitType = typeChecker.getReturnTypeOfSignature(signature);
            nodeType = typeChecker.typeToTypeNode(implicitType, undefined, ts.NodeBuilderFlags.NoTruncation);
        }
        const type = new typeResolver_1.TypeResolver(nodeType, this.current).resolve();
        const responses = this.commonResponses.concat(this.getMethodResponses());
        const successStatus = responses.reduce((prev, curr) => (curr.status >= 200 && curr.status < prev ? curr.status : prev), 200);
        const pathParameters = this.getPathParameters(`${this.parentPath}${this.path}`);
        const queryParameters = this.getParameters('query');
        const bodyParameters = this.getParameters('body');
        return {
            extensions: this.getExtensions(),
            deprecated: this.getIsDeprecated(),
            description: (0, jsDocUtils_1.getJSDocDescription)(this.node),
            isHidden: this.getIsHidden(),
            method: this.method ?? 'get',
            name: this.node.name.text,
            operationId: this.getOperationId(),
            parameters: [...pathParameters, ...queryParameters, ...bodyParameters],
            path: this.path,
            produces: this.produces,
            consumes: this.consumes,
            responses,
            successStatus,
            security: this.getSecurity(),
            summary: (0, jsDocUtils_1.getJSDocComment)(this.node, 'summary'),
            tags: this.getTags(),
            type,
        };
    }
    getExtensions() {
        const extensionDecorators = this.getDecoratorsByIdentifier(this.node, 'Extension');
        if (!extensionDecorators || !extensionDecorators.length) {
            return [];
        }
        return (0, extension_1.getExtensions)(extensionDecorators, this.current);
    }
    getCurrentLocation() {
        const methodId = this.node.name;
        const controllerId = this.node.parent.name;
        return `${controllerId.text}.${methodId.text}`;
    }
    processMethodDecorators() {
        const methodDecorators = (0, decoratorUtils_1.getDecorators)(this.node, (identifier) => identifier.text === 'SwaggerMethod');
        const pathDecorators = (0, decoratorUtils_1.getDecorators)(this.node, (identifier) => identifier.text === 'SwaggerPath');
        if (!methodDecorators?.length && !pathDecorators?.length) {
            return;
        }
        if (methodDecorators.length > 1) {
            throw new exceptions_1.GenerateMetadataError(`Only one method decorator in '${this.getCurrentLocation()}' method, Found: ${methodDecorators
                .map((d) => d.text)
                .join(', ')}`);
        }
        if (pathDecorators.length > 1) {
            throw new exceptions_1.GenerateMetadataError(`Only one path decorator in '${this.getCurrentLocation()}' method, Found: ${pathDecorators
                .map((d) => d.text)
                .join(', ')}`);
        }
        const [methodDecorator] = methodDecorators;
        const [pathDecorator] = pathDecorators;
        this.method = methodDecorator ? (0, decoratorUtils_1.getMethod)(methodDecorator, this.current.typeChecker) ?? 'get' : 'get';
        // if you don't pass in a path to the method decorator, we'll just use the base route
        // what if someone has multiple no argument methods of the same type in a single controller?
        // we need to throw an error there
        if (pathDecorator) {
            this.path = (0, decoratorUtils_1.getPath)(pathDecorator, this.current.typeChecker);
        }
        else {
            this.path = '';
        }
    }
    getMethodResponses() {
        const decorators = this.getDecoratorsByIdentifier(this.node, 'SwaggerResponse');
        if (!decorators || !decorators.length) {
            return [];
        }
        return decorators.map((decorator) => {
            const [status, description, example, produces] = (0, decoratorUtils_1.getDecoratorValues)(decorator, this.current.typeChecker);
            return {
                description: description || '',
                examples: example === undefined ? undefined : [example],
                name: status || '200',
                status: parseInt(status, 10),
                produces: this.getProducesAdapter(produces),
                schema: this.getSchemaFromDecorator(decorator, 0),
                headers: this.getHeadersFromDecorator(decorator, 1),
            };
        });
    }
    schemaToParameter(schema, inType) {
        if (schema.dataType === 'intersection' || schema.dataType === 'union') {
            return schema.types.reduce((prev, curr) => {
                return prev.concat(this.schemaToParameter(curr, inType));
            }, []);
        }
        if (schema.dataType === 'nestedObjectLiteral' || schema.dataType === 'refObject') {
            return schema.properties.map((prop) => {
                return {
                    description: prop.description,
                    in: inType === 'body' ? 'body-prop' : 'query',
                    parameterName: prop.name,
                    name: prop.name,
                    required: prop.required,
                    type: prop.type,
                    validators: prop.validators,
                    deprecated: false,
                };
            });
        }
        return [];
    }
    getParameters(type) {
        const queryParamsDecorators = this.getDecoratorsByIdentifier(this.node, type === 'body' ? 'SwaggerBody' : 'SwaggerQueryParams');
        if (!queryParamsDecorators || !queryParamsDecorators.length) {
            return [];
        }
        const firstDecorator = queryParamsDecorators[0];
        const schema = this.getSchemaFromDecorator(firstDecorator, 0);
        if (!schema) {
            return [];
        }
        return this.schemaToParameter(schema, type);
    }
    getPathParameters(path) {
        // find params, which could be ':id' or '{id}'
        const params = path.match(/(:|\{)([^}]+)(\}|$)/g);
        if (!params) {
            return [];
        }
        return params.map((param) => {
            const name = param.replace(/[:{}]/g, '');
            return {
                description: name,
                in: 'path',
                name,
                parameterName: name,
                required: true,
                type: { dataType: 'string' },
                validators: {},
                deprecated: false,
            };
        });
    }
    getHeadersFromDecorator({ parent: expression }, headersIndex) {
        if (!ts.isCallExpression(expression)) {
            return undefined;
        }
        return (0, headerTypeHelpers_1.getHeaderType)(expression.typeArguments, headersIndex, this.current);
    }
    getSchemaFromDecorator({ parent: expression }, schemaIndex) {
        if (!ts.isCallExpression(expression) || !expression.typeArguments?.length) {
            return undefined;
        }
        return new typeResolver_1.TypeResolver(expression.typeArguments[schemaIndex], this.current).resolve();
    }
    getIsDeprecated() {
        if ((0, jsDocUtils_1.isExistJSDocTag)(this.node, (tag) => tag.tagName.text === 'deprecated')) {
            return true;
        }
        const depDecorators = this.getDecoratorsByIdentifier(this.node, 'Deprecated');
        if (!depDecorators || !depDecorators.length) {
            return false;
        }
        if (depDecorators.length > 1) {
            throw new exceptions_1.GenerateMetadataError(`Only one Deprecated decorator allowed in '${this.getCurrentLocation()}' method.`);
        }
        return true;
    }
    getOperationId() {
        const opDecorators = this.getDecoratorsByIdentifier(this.node, 'OperationId');
        if (!opDecorators || !opDecorators.length) {
            return undefined;
        }
        if (opDecorators.length > 1) {
            throw new exceptions_1.GenerateMetadataError(`Only one OperationId decorator allowed in '${this.getCurrentLocation()}' method.`);
        }
        const values = (0, decoratorUtils_1.getDecoratorValues)(opDecorators[0], this.current.typeChecker);
        return values && values[0];
    }
    getTags() {
        const tagsDecorators = this.getDecoratorsByIdentifier(this.node, 'Tags');
        if (!tagsDecorators || !tagsDecorators.length) {
            return this.parentTags;
        }
        if (tagsDecorators.length > 1) {
            throw new exceptions_1.GenerateMetadataError(`Only one Tags decorator allowed in '${this.getCurrentLocation()}' method.`);
        }
        const tags = (0, decoratorUtils_1.getDecoratorValues)(tagsDecorators[0], this.current.typeChecker);
        if (tags && this.parentTags) {
            tags.push(...this.parentTags);
        }
        return tags;
    }
    getSecurity() {
        const noSecurityDecorators = this.getDecoratorsByIdentifier(this.node, 'NoSecurity');
        const securityDecorators = this.getDecoratorsByIdentifier(this.node, 'Security');
        if (noSecurityDecorators?.length > 1) {
            throw new exceptions_1.GenerateMetadataError(`Only one NoSecurity decorator allowed in '${this.getCurrentLocation()}' method.`);
        }
        if (noSecurityDecorators?.length && securityDecorators?.length) {
            throw new exceptions_1.GenerateMetadataError(`NoSecurity decorator cannot be used in conjunction with Security decorator in '${this.getCurrentLocation()}' method.`);
        }
        if (noSecurityDecorators?.length) {
            return [];
        }
        if (!securityDecorators || !securityDecorators.length) {
            return this.parentSecurity || [];
        }
        return securityDecorators.map((d) => (0, decoratorUtils_1.getSecurites)(d, this.current.typeChecker));
    }
    getIsHidden() {
        const hiddenDecorators = this.getDecoratorsByIdentifier(this.node, 'Hidden');
        if (!hiddenDecorators || !hiddenDecorators.length) {
            return !!this.isParentHidden;
        }
        if (this.isParentHidden) {
            throw new exceptions_1.GenerateMetadataError(`Hidden decorator cannot be set on '${this.getCurrentLocation()}' it is already defined on the controller`);
        }
        if (hiddenDecorators.length > 1) {
            throw new exceptions_1.GenerateMetadataError(`Only one Hidden decorator allowed in '${this.getCurrentLocation()}' method.`);
        }
        return true;
    }
    getDecoratorsByIdentifier(node, id) {
        return (0, decoratorUtils_1.getDecorators)(node, (identifier) => identifier.text === id);
    }
    getProducesAdapter(produces) {
        if (Array.isArray(produces)) {
            return produces;
        }
        else if (typeof produces === 'string') {
            return [produces];
        }
        return;
    }
}
exports.MethodGenerator = MethodGenerator;
