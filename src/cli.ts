import fs from 'fs'
import path from 'path'

import { program } from 'commander'
import * as tsj from 'ts-json-schema-generator'
import * as ts from 'typescript'
import * as TJS from 'typescript-json-schema'

import { runSpecGeneration } from './generate-specs'
import { processProgram, generateSwagger } from './index'

export const runCli = () => {
  program.name('tstoswag').description('CLI to generate swagger documentation from typescript files').version('0.0.1')

  program.requiredOption('-f, --file <char>', 'Path to the typescript file')
  program.requiredOption('--tsconfig <char>', 'Path to the ts config file')
  program.option('-o, --output <char>', 'Path to the output directory, default to ./swagger', 'swagger')

  program.option('-t, --title <char>', 'Title of the swagger file', 'Swagger API')
  program.option('-v, --version <char>', 'Version of the swagger file', '1.0.0')
  program.option('-d, --description <char>', 'Description of the swagger file', 'Swagger API')

  program.parse()

  const options = program.opts()
  const { file, output, tsconfig } = options

  const absoluteFilePath = path.resolve(process.cwd(), file)

  console.log('Processing file: ', absoluteFilePath)

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
  const tsConfigFileName = path.resolve(process.cwd(), 'tsconfig.json')
  const tsConfigFile = ts.readConfigFile(tsConfigFileName, ts.sys.readFile)
  const tsConfigContent = ts.parseJsonConfigFileContent(tsConfigFile.config, ts.sys, process.cwd())

  runSpecGeneration({
    configuration: {
      spec: {
        outputDirectory: path.join(process.cwd(), output),
      },
      routes: {
        routesDir: path.join(process.cwd(), output),
      },
      entryFile: absoluteFilePath,
      compilerOptions: tsConfigContent.options,
    },
  })
    .then((result) => {
      console.log('Result: ', result)
    })
    .catch((err) => {
      console.log('Error: ', err)
    })
}
