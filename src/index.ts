/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from 'typescript'

import * as Decorators from './decorators'
import { parseClass } from './processor/ts-processor'
import { generateSwagger } from './swagger'
import { JSONSchema, ParsedMethod } from './types'

export const processProgram = (files: string[]) => {
  const program: ts.Program = ts.createProgram(files, {})
  const checker: ts.TypeChecker = program.getTypeChecker()

  const myComponentSourceFile = program.getSourceFile(files[0])!
  const parsedMethods: ParsedMethod[] = []
  if (myComponentSourceFile) {
    const allSchemas: JSONSchema = {}
    ts.forEachChild(myComponentSourceFile, (node) => {
      if (ts.isClassDeclaration(node)) {
        const { methods, allSchemas: newAllSchemas } = parseClass(node, checker, allSchemas)
        allSchemas.definitions = {
          ...allSchemas.definitions,
          ...newAllSchemas.definitions,
        }
        parsedMethods.push(...methods)
      }
    })
    return { parsedMethods, allSchemas }
  } else {
    console.log('Given source file not found')
  }
}

export { generateSwagger }

export { Decorators }
