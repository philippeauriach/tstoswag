/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Config, createGenerator } from 'ts-json-schema-generator'
import ts from 'typescript'

import {
  parseMethodDecorator,
  parsePathDecorator,
  parseRequestBodyDecorator,
  parseRequestQueryParamsDecorator,
  parseResponseDecorator,
  parseTagDecorator,
} from './decoratorsParser'
import { JSONSchema, ParsedMethod } from '../types'

const cacheByFilePath = new Map<string, JSONSchema>()

export const parseClass = (
  node: ts.Node,
  checker: ts.TypeChecker,
  allSchemas: JSONSchema,
  tsconfigPath: string,
): { methods: ParsedMethod[]; allSchemas: JSONSchema } => {
  if (!ts.isClassDeclaration(node)) {
    return { methods: [], allSchemas }
  }
  const classData: {
    mainPath?: string
    mainPathParams?: string[]
    tags?: string[]
  } = {}
  // first, check if the class has a SwaggerPath or SwaggerTag decorator
  const decorators = ts.getDecorators(node)
  decorators?.forEach((decorator) => {
    const { path, pathParams } = parsePathDecorator({ decorator, checker, tsconfigPath })
    if (path) {
      classData.mainPath = path
      classData.mainPathParams = pathParams
    }
    const { tags } = parseTagDecorator({ decorator, checker, tsconfigPath })
    if (tags) {
      classData.tags = tags
    }
  })
  const updatedAllSchemas = { ...allSchemas }
  const results: ParsedMethod[] = []
  // list all methods and check if they have a SwaggerMethod decorator
  ts.forEachChild(node, (node) => {
    if (ts.isMethodDeclaration(node)) {
      const { parsedMethod, allSchemas: newAllSchemas } =
        parseMethod(node, checker, updatedAllSchemas, tsconfigPath) ?? {}
      if (newAllSchemas) {
        updatedAllSchemas.definitions = {
          ...updatedAllSchemas.definitions,
          ...newAllSchemas.definitions,
        }
      }
      if (parsedMethod) {
        if (!parsedMethod.path && !classData.mainPath) {
          console.log('Missing path for method', parsedMethod)
          return
          //throw new Error('No path found for method')
        }
        if (classData.mainPath) {
          parsedMethod.path = (classData.mainPath ?? '') + (parsedMethod.path ?? '')
          parsedMethod.pathParams = (classData.mainPathParams ?? []).concat(parsedMethod.pathParams ?? [])
        }
        if (classData.tags) {
          parsedMethod.tags = (classData.tags ?? []).concat(parsedMethod.tags ?? [])
        }
        results.push(parsedMethod)
      }
    }
  })
  return { methods: results, allSchemas: updatedAllSchemas }
}

export const parseMethod = (
  node: ts.Node,
  checker: ts.TypeChecker,
  allSchemas: JSONSchema,
  tsconfigPath: string,
): { parsedMethod: ParsedMethod; allSchemas: JSONSchema } | undefined => {
  if (!ts.isMethodDeclaration(node)) {
    return
  }
  // first, check if the class has a SwaggerPath decorator
  const decorators = ts.getDecorators(node)
  let result: ParsedMethod = {}

  decorators?.forEach((decorator) => {
    const opts = { decorator, checker, tsconfigPath }
    const pathData = parsePathDecorator(opts)
    const methodData = parseMethodDecorator(opts)
    const requestQueryParamsData = parseRequestQueryParamsDecorator(opts)
    const requestBodyData = parseRequestBodyDecorator(opts)
    const responseData = parseResponseDecorator(opts)
    const tagData = parseTagDecorator(opts)
    allSchemas.definitions = {
      ...allSchemas.definitions,
      ...requestQueryParamsData?.jsonSchema?.definitions,
      ...requestBodyData?.jsonSchema?.definitions,
      ...responseData?.jsonSchema?.definitions,
    }
    if (requestQueryParamsData?.typeName) {
      result.requestQueryParams = { ref: requestQueryParamsData.typeName, isArray: requestQueryParamsData.isArray }
    }
    if (requestBodyData?.typeName) {
      result.requestBody = { ref: requestBodyData.typeName, isArray: requestBodyData.isArray }
    }
    if (responseData?.status) {
      result.responses = result.responses ?? []
      result.responses.push({ status: responseData.status, ref: responseData.typeName, isArray: responseData.isArray })
    }
    result = {
      ...result,
      ...pathData,
      ...methodData,
      ...tagData,
    }
  })
  return {
    parsedMethod: result,
    allSchemas,
  }
}

export const processTypeWithJsonSchemaGenerator = ({
  filePath,
  tsconfigPath,
  typeName,
}: {
  filePath: string
  tsconfigPath?: string
  typeName: string
}) => {
  const config: Config = {
    path: filePath,
    tsconfig: tsconfigPath,
    type: typeName,
    expose: 'all',
  }
  const cacheKey = `${filePath}-${typeName}`
  if (cacheByFilePath.has(cacheKey)) {
    return cacheByFilePath.get(cacheKey)
  }
  const res = createGenerator(config).createSchema(config.type)
  cacheByFilePath.set(cacheKey, res)
  return res
}

export const processUnknownParameterizedType = ({
  typeArgument,
  checker,
  tsconfigPath,
}: {
  typeArgument: ts.TypeNode
  checker: ts.TypeChecker
  tsconfigPath: string
}) => {
  let isArray = false
  let type = checker.getTypeAtLocation(typeArgument)
  let rawType = checker.typeToString(type)
  let shouldProcess = rawType === type.aliasSymbol?.escapedName
  let typeName = type.aliasSymbol?.escapedName
  // handle T[] type
  if (typeArgument.kind === ts.SyntaxKind.ArrayType) {
    isArray = true
    const arrayType = typeArgument as ts.ArrayTypeNode
    type = checker.getTypeAtLocation(arrayType.elementType)
  }
  // handle Array<T> type
  if (typeArgument.kind === ts.SyntaxKind.TypeReference) {
    const typeReference = typeArgument as ts.TypeReferenceNode
    const identifier = typeReference.typeName as ts.Identifier
    if (typeReference.typeName.kind === ts.SyntaxKind.Identifier && identifier.escapedText === 'Array') {
      isArray = true
      type = checker.getTypeAtLocation(typeReference.typeArguments![0])
      typeName = type.aliasSymbol?.escapedName
      rawType = checker.typeToString(type)
      shouldProcess = rawType === typeName
    }
  }
  if (shouldProcess && typeName) {
    // true type usable by json-schema-generator
    return {
      typeName,
      isArray,
      jsonSchema: processTypeWithJsonSchemaGenerator({
        filePath: typeArgument.getSourceFile().fileName,
        typeName: rawType,
        tsconfigPath,
      }),
    }
  }
  // unknown type, we need to process it ourselves
  console.log('Unsuported type', type.aliasSymbol?.escapedName, rawType, typeName, `kind= ${typeArgument.kind}`)
  throw new Error('This type is not supported yet!')
}
