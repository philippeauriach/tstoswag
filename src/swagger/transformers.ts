import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

import { defaultResponseDescriptionFromCode } from './utils'
import { JSONSchema, ParsedMethod } from '../types'

export const generatePathParams = (
  pathParams?: string[],
): (OpenAPIV3_1.ParameterObject | OpenAPIV3_1.ReferenceObject)[] => {
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

export const generateQueryParams = (
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

export const generateRequestBody = (
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

export const generateResponses = (
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

export const schemaPropertyToOpenAPIV3Property = (property?: JSONSchema7): OpenAPIV3.SchemaObject | undefined => {
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

export const getSwaggerSchemaFromDefinition = (
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

export const generateSwaggerSchemas = (schema: JSONSchema): OpenAPIV3_1.ComponentsObject['schemas'] => {
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
