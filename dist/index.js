"use strict";
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSwagger = exports.processProgram = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const typescript_1 = __importDefault(require("typescript"));
const ts_processor_1 = require("./processor/ts-processor");
const swagger_1 = require("./swagger");
Object.defineProperty(exports, "generateSwagger", { enumerable: true, get: function () { return swagger_1.generateSwagger; } });
const processProgram = (files, tsconfigPath) => {
    // files might contain a glob pattern, so we need to expand it
    const expandedFiles = typescript_1.default.sys.readDirectory(process.cwd(), files, undefined, ['node_modules']);
    console.log('Expanded files: ', expandedFiles);
    const program = typescript_1.default.createProgram(files, {});
    const checker = program.getTypeChecker();
    const allFiles = program.getSourceFiles();
    const allSchemas = {};
    const parsedMethods = [];
    for (const file of allFiles) {
        const myComponentSourceFile = file;
        if (myComponentSourceFile) {
            console.log('Processing file: ', myComponentSourceFile.fileName);
            typescript_1.default.forEachChild(myComponentSourceFile, (node) => {
                if (typescript_1.default.isClassDeclaration(node)) {
                    try {
                        const { methods, allSchemas: newAllSchemas } = (0, ts_processor_1.parseClass)(node, checker, allSchemas, tsconfigPath);
                        allSchemas.definitions = {
                            ...allSchemas.definitions,
                            ...newAllSchemas.definitions,
                        };
                        parsedMethods.push(...methods);
                    }
                    catch (e) {
                        console.log('Error while processing file', myComponentSourceFile.fileName, e);
                    }
                }
            });
        }
        else {
            console.log('Given source file not found');
        }
    }
    return { parsedMethods, allSchemas };
};
exports.processProgram = processProgram;
__exportStar(require("./decorators"), exports);
