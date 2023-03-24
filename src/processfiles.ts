/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Config, createGenerator } from 'ts-json-schema-generator'
import ts from 'typescript'

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

const parseClass = (
  node: ts.Node,
  checker: ts.TypeChecker,
  allSchemas: JSONSchema,
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
    const { path, pathParams } = parsePathDecorator({ decorator, checker })
    if (path) {
      classData.mainPath = path
      classData.mainPathParams = pathParams
    }
    const { tags } = parseTagDecorator({ decorator, checker })
    if (tags) {
      classData.tags = tags
    }
  })
  const updatedAllSchemas = { ...allSchemas }
  const results: ParsedMethod[] = []
  // list all methods and check if they have a SwaggerMethod decorator
  ts.forEachChild(node, (node) => {
    if (ts.isMethodDeclaration(node)) {
      const { parsedMethod, allSchemas: newAllSchemas } = parseMethod(node, checker, updatedAllSchemas) ?? {}
      if (newAllSchemas) {
        updatedAllSchemas.definitions = {
          ...updatedAllSchemas.definitions,
          ...newAllSchemas.definitions,
        }
      }
      if (parsedMethod) {
        if (!parsedMethod.path && !classData.mainPath) {
          console.log('Missing path for method', parseMethod)
          throw new Error('No path found for method')
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

const cleanupRawString = (str: string) => {
  return str.replace(/['"`]/g, '')
}

const parseMethod = (
  node: ts.Node,
  checker: ts.TypeChecker,
  allSchemas: JSONSchema,
): { parsedMethod: ParsedMethod; allSchemas: JSONSchema } | undefined => {
  if (!ts.isMethodDeclaration(node)) {
    return
  }
  // first, check if the class has a SwaggerPath decorator
  const decorators = ts.getDecorators(node)
  let result: ParsedMethod = {}

  decorators?.forEach((decorator) => {
    const pathData = parsePathDecorator({ decorator, checker })
    const methodData = parseMethodDecorator({ decorator, checker })
    const requestQueryParamsData = parseRequestQueryParamsDecorator({ decorator, checker })
    const requestBodyData = parseRequestBodyDecorator({ decorator, checker })
    const responseData = parseResponseDecorator({ decorator, checker })
    const tagData = parseTagDecorator({ decorator, checker })
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

const parsePathDecorator = ({ decorator, checker }: { decorator: ts.Decorator; checker: ts.TypeChecker }) => {
  if (!ts.isCallExpression(decorator.expression)) {
    return {}
  }
  const type = checker.getTypeAtLocation(decorator.expression.expression)
  const symbol = type.getSymbol()!
  if (symbol.escapedName === 'SwaggerPath') {
    const path = decorator.expression.arguments[0].getText().trim()
    if (path.length === 0) {
      return {}
    }
    const rawPath = cleanupRawString(path)
    //replace :paramName with {paramName}
    const pathWithBrackets = rawPath.replace(/:[a-zA-Z0-9]+/g, (match) => `{${match.replace(':', '')}}`)
    //extract parameters named {paramName}
    const paramsMatch = pathWithBrackets.match(/{[a-zA-Z0-9]+}/g)
    const params = paramsMatch?.map((param) => param.replace('{', '').replace('}', '')) ?? []
    return { path: cleanupRawString(pathWithBrackets), pathParams: params }
  }
  return {}
}

const parseTagDecorator = ({ decorator, checker }: { decorator: ts.Decorator; checker: ts.TypeChecker }) => {
  if (!ts.isCallExpression(decorator.expression)) {
    return {}
  }
  const type = checker.getTypeAtLocation(decorator.expression.expression)
  const symbol = type.getSymbol()!
  if (symbol.escapedName === 'SwaggerTag') {
    const tags = decorator.expression.arguments.map((elt) => cleanupRawString(elt.getText().trim()))
    return { tags }
  }
  return {}
}

const parseMethodDecorator = ({ decorator, checker }: { decorator: ts.Decorator; checker: ts.TypeChecker }) => {
  if (!ts.isCallExpression(decorator.expression)) {
    return {}
  }
  const type = checker.getTypeAtLocation(decorator.expression.expression)
  const symbol = type.getSymbol()!
  if (symbol.escapedName === 'SwaggerMethod') {
    const firstArg = cleanupRawString(decorator.expression.arguments[0].getText())
    if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(firstArg)) {
      return { method: firstArg }
    }
  }
  return {}
}

const parseRequestBodyDecorator = ({
  decorator,
  checker,
}: {
  decorator: ts.Decorator
  checker: ts.TypeChecker
}): { typeName?: string; isArray?: boolean; jsonSchema?: JSONSchema } | undefined => {
  if (!ts.isCallExpression(decorator.expression)) {
    return undefined
  }
  const type = checker.getTypeAtLocation(decorator.expression.expression)
  const symbol = type.getSymbol()!
  if (symbol.escapedName !== 'SwaggerBody') {
    return undefined
  }
  // SwaggerBody is declared as SwaggerBody<T>()
  // so we need to get the type argument from the decorator call expression
  const typeArgument = decorator.expression.typeArguments?.[0]
  if (typeArgument) {
    return processUnknownParameterizedType(typeArgument, checker)
  }
}

const parseRequestQueryParamsDecorator = ({
  decorator,
  checker,
}: {
  decorator: ts.Decorator
  checker: ts.TypeChecker
}): { typeName?: string; isArray?: boolean; jsonSchema?: JSONSchema } | undefined => {
  if (!ts.isCallExpression(decorator.expression)) {
    return undefined
  }
  const type = checker.getTypeAtLocation(decorator.expression.expression)
  const symbol = type.getSymbol()!
  if (symbol.escapedName !== 'SwaggerQueryParams') {
    return undefined
  }
  // SwaggerQueryParams is declared as SwaggerQueryParams<T>()
  // so we need to get the type argument from the decorator call expression
  const typeArgument = decorator.expression.typeArguments?.[0]
  if (typeArgument) {
    return processUnknownParameterizedType(typeArgument, checker)
  }
}

const parseResponseDecorator = ({
  decorator,
  checker,
}: {
  decorator: ts.Decorator
  checker: ts.TypeChecker
}):
  | {
      status: number
      typeName?: string
      isArray?: boolean
      jsonSchema?: JSONSchema
    }
  | undefined => {
  if (!ts.isCallExpression(decorator.expression)) {
    return undefined
  }
  const type = checker.getTypeAtLocation(decorator.expression.expression)
  const symbol = type.getSymbol()!
  if (symbol.escapedName !== 'SwaggerResponse') {
    return undefined
  }
  let status = 200
  if (decorator.expression.arguments.length > 0) {
    const firstArg = decorator.expression.arguments[0]
    if (ts.isNumericLiteral(firstArg)) {
      status = parseInt(firstArg.text, 10)
    }
  }
  // SwaggerResponse is declared as SwaggerResponse<T>()
  // so we need to get the type argument from the decorator call expression
  const typeArgument = decorator.expression.typeArguments?.[0]
  let schema: ReturnType<typeof processUnknownParameterizedType> | undefined
  if (typeArgument) {
    schema = processUnknownParameterizedType(typeArgument, checker)
  }
  return {
    status,
    typeName: schema?.typeName,
    jsonSchema: schema?.jsonSchema,
    isArray: schema?.isArray,
  }
}

const cacheByFilePath = new Map<string, JSONSchema>()

const processTypeWithJsonSchemaGenerator = ({
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

const processUnknownParameterizedType = (typeArgument: ts.TypeNode, checker: ts.TypeChecker) => {
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
        filePath: type.aliasSymbol!.declarations![0].getSourceFile().fileName,
        typeName: rawType,
      }),
    }
  }
  // unknown type, we need to process it ourselves
  console.log('Unsuported type', type.aliasSymbol?.escapedName, rawType, `kind= ${typeArgument.kind}`)
  throw new Error('This type is not supported yet!')
}
