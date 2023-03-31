"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSwagger = exports.processProgram = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const typescript_1 = __importDefault(require("typescript"));
const ts_processor_1 = require("./processor/ts-processor");
const swagger_1 = require("./swagger");
const processProgram = (files) => {
    const program = typescript_1.default.createProgram(files, {});
    const checker = program.getTypeChecker();
    const myComponentSourceFile = program.getSourceFile(files[0]);
    const parsedMethods = [];
    if (myComponentSourceFile) {
        const allSchemas = {};
        typescript_1.default.forEachChild(myComponentSourceFile, (node) => {
            if (typescript_1.default.isClassDeclaration(node)) {
                const { methods, allSchemas: newAllSchemas } = (0, ts_processor_1.parseClass)(node, checker, allSchemas);
                allSchemas.definitions = {
                    ...allSchemas.definitions,
                    ...newAllSchemas.definitions,
                };
                parsedMethods.push(...methods);
            }
        });
        return { parsedMethods, allSchemas };
    }
    else {
        console.log('Given source file not found');
    }
};
exports.processProgram = processProgram;
exports.generateSwagger = swagger_1.generateSwagger;
