#! /usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs')
const path = require('path')

const { program } = require('commander')

const { processProgram, generateSwagger } = require('../dist/index')

program.name('tstoswag').description('CLI to generate swagger documentation from typescript files').version('0.0.1')

program.requiredOption('-f, --file <char>', 'Path to the typescript file')
program.option('-o, --output <char>', 'Path to the output directory, default to ./swagger', 'swagger')

//options for swagger file: title, version, description
program.option('-t, --title <char>', 'Title of the swagger file', 'Swagger API')
program.option('-v, --version <char>', 'Version of the swagger file', '1.0.0')
program.option('-d, --description <char>', 'Description of the swagger file', 'Swagger API')

program.parse()

const options = program.opts()
const { file, output } = options

const absoluteFilePath = path.resolve(process.cwd(), file)

console.log('Processing file: ', absoluteFilePath)

const result = processProgram([absoluteFilePath])

const swaggerDefinition = generateSwagger({
  methods: result.parsedMethods,
  schema: result.allSchemas,
  info: {
    title: options.title,
    version: options.version,
    description: options.description,
  },
})

console.log('Writing swagger definition to: ', path.join(process.cwd(), output, 'swagger.json'))
fs.mkdirSync(path.join(process.cwd(), output), { recursive: true })
fs.writeFileSync(path.join(process.cwd(), output, 'swagger.json'), JSON.stringify(swaggerDefinition, null, 2))
