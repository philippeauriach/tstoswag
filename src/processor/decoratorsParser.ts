/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from 'typescript'

import { processUnknownParameterizedType } from './ts-processor'
import { JSONSchema } from '../types'

const cleanupRawString = (str: string) => {
  return str.replace(/['"`]/g, '')
}

export const parsePathDecorator = ({ decorator, checker }: { decorator: ts.Decorator; checker: ts.TypeChecker }) => {
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

export const parseTagDecorator = ({ decorator, checker }: { decorator: ts.Decorator; checker: ts.TypeChecker }) => {
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

export const parseMethodDecorator = ({ decorator, checker }: { decorator: ts.Decorator; checker: ts.TypeChecker }) => {
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

export const parseRequestBodyDecorator = ({
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

export const parseRequestQueryParamsDecorator = ({
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

export const parseResponseDecorator = ({
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
