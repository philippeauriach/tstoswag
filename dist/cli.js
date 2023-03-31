"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCli = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const commander_1 = require("commander");
const index_1 = require("./index");
const runCli = () => {
    commander_1.program.name('tstoswag').description('CLI to generate swagger documentation from typescript files').version('0.0.1');
    commander_1.program.requiredOption('-f, --file <char>', 'Path to the typescript file');
    commander_1.program.option('-o, --output <char>', 'Path to the output directory, default to ./swagger', 'swagger');
    //options for swagger file: title, version, description
    commander_1.program.option('-t, --title <char>', 'Title of the swagger file', 'Swagger API');
    commander_1.program.option('-v, --version <char>', 'Version of the swagger file', '1.0.0');
    commander_1.program.option('-d, --description <char>', 'Description of the swagger file', 'Swagger API');
    commander_1.program.parse();
    const options = commander_1.program.opts();
    const { file, output } = options;
    const absoluteFilePath = path_1.default.resolve(process.cwd(), file);
    console.log('Processing file: ', absoluteFilePath);
    const result = (0, index_1.processProgram)([absoluteFilePath]);
    if (!result) {
        console.log('No result found');
        process.exit(1);
    }
    const swaggerDefinition = (0, index_1.generateSwagger)({
        methods: result.parsedMethods,
        schema: result.allSchemas,
        info: {
            title: options.title,
            version: options.version,
            description: options.description,
        },
    });
    console.log('Writing swagger definition to: ', path_1.default.join(process.cwd(), output, 'swagger.json'));
    fs_1.default.mkdirSync(path_1.default.join(process.cwd(), output), { recursive: true });
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), output, 'swagger.json'), JSON.stringify(swaggerDefinition, null, 2));
};
exports.runCli = runCli;
