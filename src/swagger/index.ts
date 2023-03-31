import { OpenAPIV3_1 } from 'openapi-types'

import {
  generatePathParams,
  generateQueryParams,
  generateRequestBody,
  generateResponses,
  generateSwaggerSchemas,
} from './transformers'
import { JSONSchema, ParsedMethod } from '../types'

export const generateSwagger = ({
  methods,
  schema,
  info,
}: {
  methods: ParsedMethod[]
  schema: JSONSchema
  info: Partial<{
    title: string
    version: string
    description: string
  }>
}) => {
  const methodsGroupedByPath = methods.reduce<Record<string, ParsedMethod[]>>((acc, method) => {
    if (!method.path) {
      return acc
    }
    if (!acc[method.path]) {
      acc[method.path] = []
    }
    acc[method.path].push(method)
    return acc
  }, {})

  const document: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: 'API',
      version: '1.0.0',
      description: 'API',
      ...info,
    },
    paths: Object.entries(methodsGroupedByPath).reduce<OpenAPIV3_1.PathsObject>((acc, [path, methods]) => {
      acc[path] = methods.reduce<OpenAPIV3_1.PathItemObject>((acc, method) => {
        if (!method.method) {
          return acc
        }
        acc[method.method.toLowerCase() as OpenAPIV3_1.HttpMethods] = {
          //TODO: find a way to pass summary and description from jsdoc ?
          // summary: '',
          // description: '',
          tags: method.tags,
          parameters: [
            ...generatePathParams(method.pathParams),
            ...generateQueryParams(method.requestQueryParams, schema),
          ],
          requestBody: generateRequestBody(method.requestBody),
          responses: generateResponses(method.responses),
        }
        return acc
      }, {})
      return acc
    }, {}),
    components: {
      schemas: generateSwaggerSchemas(schema),
    },
  }

  return document
}
