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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSpecGeneration = exports.validateSpecConfig = exports.generateSpec = exports.getSwaggerOutputPath = void 0;
const fs_1 = __importDefault(require("fs"));
const node_path_1 = require("node:path");
const metadataGenerator_1 = require("./metadataGenerator");
const specGenerator3_1 = require("./specGenerator3");
const getSwaggerOutputPath = (swaggerConfig) => {
    const specFileBaseName = swaggerConfig.specFileBaseName || 'swagger';
    return `${swaggerConfig.outputDirectory}/${specFileBaseName}.json`;
};
exports.getSwaggerOutputPath = getSwaggerOutputPath;
const generateSpec = async (swaggerConfig, compilerOptions, ignorePaths, 
/**
 * pass in cached metadata returned in a previous step to speed things up
 */
metadata) => {
    if (!metadata) {
        metadata = new metadataGenerator_1.MetadataGenerator(swaggerConfig.entryFile, compilerOptions, ignorePaths, swaggerConfig.controllerPathGlobs, swaggerConfig.rootSecurity).Generate();
    }
    const spec = new specGenerator3_1.SpecGenerator3(metadata, swaggerConfig).GetSpec();
    fs_1.default.mkdirSync(swaggerConfig.outputDirectory, { recursive: true });
    const data = JSON.stringify(spec, null, '\t');
    const outputPath = (0, exports.getSwaggerOutputPath)(swaggerConfig);
    console.log('Writing swagger definition to: ', outputPath);
    fs_1.default.writeFileSync(outputPath, data, { encoding: 'utf8' });
    return metadata;
};
exports.generateSpec = generateSpec;
const workingDir = process.cwd();
const getConfig = async (configPath = 'tsoa.json') => {
    let config;
    const ext = (0, node_path_1.extname)(configPath);
    try {
        if (ext === '.js') {
            config = await Promise.resolve(`${`${workingDir}/${configPath}`}`).then(s => __importStar(require(s)));
        }
        else {
            const configRaw = fs_1.default.readFileSync(`${workingDir}/${configPath}`);
            config = JSON.parse(configRaw.toString('utf8'));
        }
    }
    catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            throw Error(`No config file found at '${configPath}'`);
        }
        else if (err.name === 'SyntaxError') {
            // eslint-disable-next-line no-console
            console.error(err);
            const errorType = ext === '.js' ? 'JS' : 'JSON';
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw Error(`Invalid ${errorType} syntax in config at '${configPath}': ${err.message}`);
        }
        else {
            // eslint-disable-next-line no-console
            console.error(err);
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw Error(`Unhandled error encountered loading '${configPath}': ${err.message}`);
        }
    }
    return config;
};
const resolveConfig = async (config) => {
    return typeof config === 'object' ? config : getConfig(config);
};
const validateCompilerOptions = (config) => {
    return (config || {});
};
const determineNoImplicitAdditionalSetting = (noImplicitAdditionalProperties) => {
    if (noImplicitAdditionalProperties === 'silently-remove-extras' ||
        noImplicitAdditionalProperties === 'throw-on-extras' ||
        noImplicitAdditionalProperties === 'ignore') {
        return noImplicitAdditionalProperties;
    }
    else {
        return 'ignore';
    }
};
const validateSpecConfig = async (config) => {
    if (!config.spec) {
        throw new Error('Missing spec: configuration must contain spec. Spec used to be called swagger in previous versions of tsoa.');
    }
    if (!config.spec.outputDirectory) {
        throw new Error('Missing outputDirectory: configuration must contain output directory.');
    }
    if (!config.entryFile && !config.controllerPathGlobs?.length) {
        throw new Error('Missing entryFile and controllerPathGlobs: Configuration must contain an entry point file or controller path globals.');
    }
    if (!!config.entryFile && !(await fs_1.default.existsSync(config.entryFile))) {
        throw new Error(`EntryFile not found: ${config.entryFile} - please check your tsoa config.`);
    }
    config.spec.version = config.spec.version || '1.0.0';
    config.spec.specVersion = config.spec.specVersion || 2;
    if (config.spec.specVersion !== 2 && config.spec.specVersion !== 3) {
        throw new Error('Unsupported Spec version.');
    }
    if (config.spec.spec && !['immediate', 'recursive', 'deepmerge', undefined].includes(config.spec.specMerging)) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid specMerging config: ${config.spec.specMerging}`);
    }
    const noImplicitAdditionalProperties = determineNoImplicitAdditionalSetting(config.noImplicitAdditionalProperties);
    config.spec.name = config.spec.name || 'My API';
    config.spec.description = config.spec.description || 'My API description';
    config.spec.license = config.spec.license || 'My License';
    config.spec.basePath = config.spec.basePath || '/';
    // defaults to template that may generate non-unique operation ids.
    // @see https://github.com/lukeautry/tsoa/issues/1005
    config.spec.operationIdTemplate = config.spec.operationIdTemplate || '{{titleCase method.name}}';
    if (!config.spec.contact) {
        config.spec.contact = {};
    }
    if (config.spec.rootSecurity) {
        if (!Array.isArray(config.spec.rootSecurity)) {
            throw new Error('spec.rootSecurity must be an array');
        }
        if (config.spec.rootSecurity) {
            const ok = config.spec.rootSecurity.every((security) => typeof security === 'object' &&
                security !== null &&
                Object.values(security).every((scope) => Array.isArray(scope)));
            if (!ok) {
                throw new Error('spec.rootSecurity must be an array of objects whose keys are security scheme names and values are arrays of scopes');
            }
        }
    }
    return {
        ...config.spec,
        noImplicitAdditionalProperties,
        entryFile: config.entryFile,
        controllerPathGlobs: config.controllerPathGlobs,
    };
};
exports.validateSpecConfig = validateSpecConfig;
const runSpecGeneration = async (args) => {
    try {
        const config = await resolveConfig(args.configuration);
        if (args.basePath) {
            config.spec.basePath = args.basePath;
        }
        if (args.host) {
            config.spec.host = args.host;
        }
        const compilerOptions = validateCompilerOptions(config.compilerOptions);
        const swaggerConfig = await (0, exports.validateSpecConfig)(config);
        await (0, exports.generateSpec)(swaggerConfig, compilerOptions, config.ignore);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Generate swagger error.\n', err);
        process.exit(1);
    }
};
exports.runSpecGeneration = runSpecGeneration;
