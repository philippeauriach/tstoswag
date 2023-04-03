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
exports.runCli = void 0;
const path_1 = __importDefault(require("path"));
const commander_1 = require("commander");
const ts = __importStar(require("typescript"));
const generate_specs_1 = require("./generate-specs");
const runCli = () => {
    commander_1.program.name('tstoswag').description('CLI to generate swagger documentation from typescript files').version('0.0.1');
    commander_1.program.requiredOption('-f, --file <char>', 'Path to the typescript file');
    commander_1.program.requiredOption('--tsconfig <char>', 'Path to the ts config file');
    commander_1.program.option('-o, --output <char>', 'Path to the output directory, default to ./swagger', 'swagger');
    commander_1.program.option('-t, --title <char>', 'Title of the swagger file', 'Swagger API');
    commander_1.program.option('-v, --version <char>', 'Version of the swagger file', '1.0.0');
    commander_1.program.option('-d, --description <char>', 'Description of the swagger file', 'Swagger API');
    commander_1.program.parse();
    const options = commander_1.program.opts();
    const { file, output, tsconfig } = options;
    const absoluteFilePath = path_1.default.resolve(process.cwd(), file);
    console.log('Processing file: ', absoluteFilePath);
    // const config: tsj.Config = {
    //   path: path.resolve(process.cwd(), file),
    //   tsconfig: path.resolve(process.cwd(), tsconfig),
    //   type: '*',
    //   skipTypeCheck: true,
    //   expose: 'all',
    // }
    // const output_path = path.resolve(process.cwd(), output, 'schema.json')
    // const schema = tsj.createGenerator(config).createSchema(config.type)
    // const schemaString = JSON.stringify(schema, null, 2)
    // fs.writeFile(output_path, schemaString, (err) => {
    //   if (err) throw err
    // })
    // try tjs
    // const settings: TJS.PartialArgs = {
    //   ignoreErrors: true,
    //   esModuleInterop: true,
    //   excludePrivate: true,
    // }
    // const compilerOptions: TJS.CompilerOptions = {}
    // // optionally pass a base path
    // const basePath = process.cwd()
    // const programTJS = TJS.getProgramFromFiles([path.resolve(process.cwd(), file)], compilerOptions, basePath)
    // const generator = TJS.buildGenerator(programTJS, settings)
    // if (!generator) {
    //   console.log('No generator found')
    //   process.exit(1)
    // }
    // const symbols = generator.getUserSymbols()
    // const user = generator.getSchemaForSymbol('User')
    // console.log('User: ', user)
    // console.log('Writing schema definition to: ', path.join(process.cwd(), output, 'schema.json'))
    // fs.writeFileSync(path.join(process.cwd(), output, 'schema.json'), JSON.stringify(symbols, null, 2))
    //min
    // const result = processProgram([absoluteFilePath], tsconfig)
    // if (!result) {
    //   console.log('No result found')
    //   process.exit(1)
    // }
    // const swaggerDefinition = generateSwagger({
    //   methods: result.parsedMethods,
    //   schema: result.allSchemas,
    //   info: {
    //     title: options.title,
    //     version: options.version,
    //     description: options.description,
    //   },
    // })
    // console.log('Writing swagger definition to: ', path.join(process.cwd(), output, 'swagger.json'))
    // fs.mkdirSync(path.join(process.cwd(), output), { recursive: true })
    // fs.writeFileSync(path.join(process.cwd(), output, 'swagger.json'), JSON.stringify(swaggerDefinition, null, 2))
    // tsoa
    const tsConfigFileName = path_1.default.resolve(process.cwd(), 'tsconfig.json');
    const tsConfigFile = ts.readConfigFile(tsConfigFileName, ts.sys.readFile);
    const tsConfigContent = ts.parseJsonConfigFileContent(tsConfigFile.config, ts.sys, process.cwd());
    (0, generate_specs_1.runSpecGeneration)({
        configuration: {
            spec: {
                name: options.title ?? 'Swagger API',
                description: options.description ?? 'Swagger API',
                license: 'private',
                outputDirectory: path_1.default.join(process.cwd(), output),
            },
            routes: {
                routesDir: path_1.default.join(process.cwd(), output),
            },
            entryFile: absoluteFilePath,
            compilerOptions: tsConfigContent.options,
        },
    })
        .then((result) => {
        console.log('Result: ', result);
    })
        .catch((err) => {
        console.log('Error: ', err);
    });
};
exports.runCli = runCli;
