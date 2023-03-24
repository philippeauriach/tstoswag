import fs from 'fs'
import path from 'path'

import { processProgram } from '../src/processfiles'
import { generateSwagger } from '../src/swagger'

describe('Should process types', () => {
  it('should process types', () => {
    const result = processProgram([path.resolve(__dirname, 'testpackage', 'file-with-types.ts')])
    if (!result) {
      throw new Error('No result')
    }
    const swaggerDefinition = generateSwagger({
      methods: result.parsedMethods,
      schema: result.allSchemas,
    })

    fs.writeFileSync(path.join(__dirname, 'output', 'schema.json'), JSON.stringify(result.allSchemas, null, 2))
    fs.writeFileSync(path.join(__dirname, 'output', 'swagger.json'), JSON.stringify(swaggerDefinition, null, 2))
  })
})
