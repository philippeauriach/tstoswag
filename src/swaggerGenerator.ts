import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

import { JSONSchema, ParsedMethod } from './types'

const generatePathParams = (pathParams?: string[]): (OpenAPIV3_1.ParameterObject | OpenAPIV3_1.ReferenceObject)[] => {
  if (!pathParams) {
    return []
  }
  return pathParams.map((param) => ({
    name: param,
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }))
}

const generateQueryParams = (
  queryParam: ParsedMethod['requestQueryParams'] | undefined,
  schema: JSONSchema,
): (OpenAPIV3_1.ParameterObject | OpenAPIV3_1.ReferenceObject)[] => {
  if (!queryParam) {
    return []
  }
  // find ref in schema
  const ref = schema.definitions?.[queryParam.ref]
  if (!ref) {
    console.error(`Could not find ref ${queryParam.ref} in schema`)
    return []
    // throw new Error(`Could not find ref ${queryParam.ref} in schema`)
  }
  // if ref is an array, return an array of ref
  if (typeof ref === 'boolean') {
    return []
  }
  if (!ref.properties) {
    console.error(`Could not find properties in ref ${queryParam.ref} in schema - for query param`)
    return []
  }
  return Object.entries(ref.properties).map(([key, property]) => {
    if (typeof property === 'boolean') {
      throw new Error("Property can't be a boolean")
    }
    const swaggerProperty = schemaPropertyToOpenAPIV3Property(property)
    return {
      name: key,
      in: 'query',
      required: ref.required?.includes(key) ?? false,
      schema: swaggerProperty,
    }
  })
}

const getRequestBody = (
  requestBody?: ParsedMethod['requestBody'],
): (OpenAPIV3_1.ReferenceObject | OpenAPIV3.RequestBodyObject) | undefined => {
  if (!requestBody) {
    return undefined
  }
  return {
    content: {
      'application/json': {
        schema: requestBody.isArray
          ? { type: 'array', items: { $ref: `#/components/schemas/${requestBody.ref}` } }
          : { $ref: `#/components/schemas/${requestBody.ref}` },
      },
    },
  }
}

const defaultResponseDescriptionFromCode = (code: string) => {
  switch (code) {
    case '200':
      return 'OK'
    case '201':
      return 'Created'
    case '204':
      return 'No Content'
    case '400':
      return 'Bad Request'
    case '401':
      return 'Unauthorized'
    case '403':
      return 'Forbidden'
    case '404':
      return 'Not Found'
    case '409':
      return 'Conflict'
    case '418':
      return "I'm a teapot"
    case '500':
      return 'Internal Server Error'
    default:
      return undefined
  }
}

const getResponses = (
  responses?: ParsedMethod['responses'],
): OpenAPIV3.ResponsesObject & OpenAPIV3_1.ResponsesObject => {
  if (!responses) {
    return {}
  }
  return Object.entries(responses).reduce<OpenAPIV3.ResponsesObject & OpenAPIV3_1.ResponsesObject>(
    (acc, [code, response]) => {
      acc[`${response.status}`] = {
        //TODO: find a way to pass description from jsdoc ?
        description: defaultResponseDescriptionFromCode(code) ?? '',
        content: response.ref
          ? {
              'application/json': response.isArray
                ? { schema: { type: 'array', items: { $ref: `#/components/schemas/${response.ref}` } } }
                : { schema: { $ref: `#/components/schemas/${response.ref}` } },
            }
          : undefined,
      }
      return acc
    },
    {},
  )
}

const schemaPropertyToOpenAPIV3Property = (property?: JSONSchema7): OpenAPIV3.SchemaObject | undefined => {
  if (!property) {
    return undefined
  }
  if (property.type === 'array') {
    const subArray = schemaPropertyToOpenAPIV3Property(property.items as JSONSchema7)
    if (!subArray) {
      return undefined
    }
    return {
      type: 'array',
      items: subArray,
    }
  }
  if (property.type === 'object') {
    return {
      type: 'object',
      properties: Object.entries(property.properties ?? {}).reduce<Record<string, OpenAPIV3.SchemaObject>>(
        (acc, [name, property]) => {
          if (typeof property === 'boolean') {
            return acc
          }
          acc[name] = property as OpenAPIV3.SchemaObject
          return acc
        },
        {},
      ),
    }
  }
  if (
    property.type === 'string' ||
    property.type === 'number' ||
    property.type === 'boolean' ||
    property.type === 'integer'
  ) {
    if (property.enum) {
      return { type: property.type, enum: property.enum }
    }
    if (property.const) {
      return { type: property.type, enum: [property.const] }
    }
    return { type: property.type }
  }
  if (property.$ref) {
    return { $ref: property.$ref.replace('#/definitions/', '#/components/schemas/') } as OpenAPIV3.SchemaObject
  }
  console.error('property not handled yet, ignoring', property)
}

const getSwaggerSchemaFromDefinition = (
  definition: JSONSchema7Definition,
): OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject | undefined => {
  if (typeof definition === 'boolean') {
    return undefined
  }
  if (definition.$ref) {
    return { $ref: definition.$ref.replace('#/definitions/', '#/components/schemas/') }
  }
  if (definition.type === 'array') {
    const subArray = getSwaggerSchemaFromDefinition(definition.items as JSONSchema7Definition)
    if (!subArray) {
      return undefined
    }
    return {
      type: 'array',
      items: subArray,
    }
  }
  if (definition.type === 'object') {
    return {
      type: 'object',
      required: definition.required,
      properties: Object.entries(definition.properties ?? {}).reduce<Record<string, OpenAPIV3.SchemaObject>>(
        (acc, [name, property]) => {
          if (typeof property === 'boolean') {
            return acc
          }
          const swaggerProperty = schemaPropertyToOpenAPIV3Property(property)
          if (swaggerProperty) {
            acc[name] = swaggerProperty
          }
          return acc
        },
        {},
      ),
    }
  }
  if (definition.anyOf) {
    return {
      anyOf: definition.anyOf
        .map(getSwaggerSchemaFromDefinition)
        .filter((x): x is OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject => !!x),
    }
  }
  if (definition.oneOf) {
    return {
      oneOf: definition.oneOf
        .map(getSwaggerSchemaFromDefinition)
        .filter((x): x is OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject => !!x),
    }
  }
  if (definition.allOf) {
    return {
      allOf: definition.allOf
        .map(getSwaggerSchemaFromDefinition)
        .filter((x): x is OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject => !!x),
    }
  }
  console.error('unhandled definition', definition)
  return {}
}

const getSwaggerSchemas = (schema: JSONSchema): OpenAPIV3_1.ComponentsObject['schemas'] => {
  if (!schema.definitions) {
    return {}
  }
  return Object.entries(schema.definitions).reduce<NonNullable<OpenAPIV3_1.ComponentsObject['schemas']>>(
    (acc, [name, definition]) => {
      const schemaFromDef = getSwaggerSchemaFromDefinition(definition)
      if (schemaFromDef) {
        acc[name] = schemaFromDef
      }
      return acc
    },
    {},
  )
}

export const generateSwagger = ({ methods, schema }: { methods: ParsedMethod[]; schema: JSONSchema }) => {
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
      //TODO: add some options to configure this
      title: 'API',
      version: '1.0.0',
      description: 'API',
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
          requestBody: getRequestBody(method.requestBody),
          responses: getResponses(method.responses),
        }
        return acc
      }, {})
      return acc
    }, {}),
    components: {
      schemas: getSwaggerSchemas(schema),
    },
  }

  return document
}
