/* eslint-disable @typescript-eslint/no-non-null-assertion */
// import ts from 'typescript'

// import { parseClass } from './processor/ts-processor'
import { generateSwagger } from './swagger'
// import { JSONSchema, ParsedMethod } from './types'

// export const processProgram = (files: string[], tsconfigPath: string) => {
//   // files might contain a glob pattern, so we need to expand it
//   const expandedFiles = ts.sys.readDirectory(process.cwd(), files, undefined, ['node_modules'])
//   console.log('Expanded files: ', expandedFiles)

//   const program: ts.Program = ts.createProgram(files, {})
//   const checker: ts.TypeChecker = program.getTypeChecker()

//   const allFiles = program.getSourceFiles()

//   const allSchemas: JSONSchema = {}
//   const parsedMethods: ParsedMethod[] = []
//   for (const file of allFiles) {
//     const myComponentSourceFile = file
//     if (myComponentSourceFile) {
//       console.log('Processing file: ', myComponentSourceFile.fileName)
//       ts.forEachChild(myComponentSourceFile, (node) => {
//         if (ts.isClassDeclaration(node)) {
//           try {
//             const { methods, allSchemas: newAllSchemas } = parseClass(node, checker, allSchemas, tsconfigPath)
//             allSchemas.definitions = {
//               ...allSchemas.definitions,
//               ...newAllSchemas.definitions,
//             }
//             parsedMethods.push(...methods)
//           } catch (e) {
//             console.log('Error while processing file', myComponentSourceFile.fileName, e)
//           }
//         }
//       })
//     } else {
//       console.log('Given source file not found')
//     }
//   }
//   return { parsedMethods, allSchemas }
// }

export { generateSwagger }

export * from './decorators'
