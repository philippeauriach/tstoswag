/* eslint-disable @typescript-eslint/prefer-optional-chain */

import { Tsoa } from '@tsoa/runtime'
import * as ts from 'typescript'

import { getDecorators, getDecoratorValues, getMethod, getPath, getSecurites } from './decoratorUtils'
import { GenerateMetadataError } from './exceptions'
import { getExtensions } from './extension'
import { getHeaderType } from './headerTypeHelpers'
import { getJSDocComment, getJSDocDescription, isExistJSDocTag } from './jsDocUtils'
import { MetadataGenerator } from './metadataGenerator'
import { TypeResolver } from './typeResolver'

export class MethodGenerator {
  private method?: 'options' | 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head'
  private path = '/'
  private produces?: string[]
  private consumes?: string

  constructor(
    private readonly node: ts.MethodDeclaration,
    private readonly current: MetadataGenerator,
    private readonly commonResponses: Array<Tsoa.Response & { status: number }>,
    private readonly parentPath?: string,
    private readonly parentTags?: string[],
    private readonly parentSecurity?: Tsoa.Security[],
    private readonly isParentHidden?: boolean,
  ) {
    this.processMethodDecorators()
  }

  public IsValid() {
    return !!this.method
  }

  public Generate(): Tsoa.Method {
    if (!this.IsValid()) {
      throw new GenerateMetadataError("This isn't a valid a controller method.")
    }

    console.log('Generating', this.method, this.parentPath, this.path)

    let nodeType = this.node.type
    if (!nodeType) {
      const typeChecker = this.current.typeChecker
      const signature = typeChecker.getSignatureFromDeclaration(this.node)
      const implicitType = typeChecker.getReturnTypeOfSignature(signature!)
      nodeType = typeChecker.typeToTypeNode(implicitType, undefined, ts.NodeBuilderFlags.NoTruncation) as ts.TypeNode
    }

    const type = new TypeResolver(nodeType, this.current).resolve()
    const responses = this.commonResponses.concat(this.getMethodResponses())
    const successStatus = responses.reduce(
      (prev, curr) => (curr.status >= 200 && curr.status < prev ? curr.status : prev),
      200,
    )
    const pathParameters = this.getPathParameters(`${this.parentPath}${this.path}`)
    const queryParameters = this.getParameters('query')
    const bodyParameters = this.getParameters('body')

    return {
      extensions: this.getExtensions(),
      deprecated: this.getIsDeprecated(),
      description: getJSDocDescription(this.node),
      isHidden: this.getIsHidden(),
      method: this.method ?? 'get',
      name: (this.node.name as ts.Identifier).text,
      operationId: this.getOperationId(),
      parameters: [...pathParameters, ...queryParameters, ...bodyParameters],
      path: this.path,
      produces: this.produces,
      consumes: this.consumes,
      responses,
      successStatus,
      security: this.getSecurity(),
      summary: getJSDocComment(this.node, 'summary'),
      tags: this.getTags(),
      type,
    }
  }

  private getExtensions() {
    const extensionDecorators = this.getDecoratorsByIdentifier(this.node, 'Extension')
    if (!extensionDecorators || !extensionDecorators.length) {
      return []
    }
    return getExtensions(extensionDecorators, this.current)
  }

  private getCurrentLocation() {
    const methodId = this.node.name as ts.Identifier
    const controllerId = (this.node.parent as ts.ClassDeclaration).name as ts.Identifier
    return `${controllerId.text}.${methodId.text}`
  }

  private processMethodDecorators() {
    const methodDecorators = getDecorators(this.node, (identifier) => identifier.text === 'SwaggerMethod')
    const pathDecorators = getDecorators(this.node, (identifier) => identifier.text === 'SwaggerPath')

    if (!methodDecorators?.length && !pathDecorators?.length) {
      return
    }
    if (methodDecorators.length > 1) {
      throw new GenerateMetadataError(
        `Only one method decorator in '${this.getCurrentLocation()}' method, Found: ${methodDecorators
          .map((d) => d.text)
          .join(', ')}`,
      )
    }
    if (pathDecorators.length > 1) {
      throw new GenerateMetadataError(
        `Only one path decorator in '${this.getCurrentLocation()}' method, Found: ${pathDecorators
          .map((d) => d.text)
          .join(', ')}`,
      )
    }

    const [methodDecorator] = methodDecorators
    const [pathDecorator] = pathDecorators

    this.method = methodDecorator ? (getMethod(methodDecorator, this.current.typeChecker) as any) ?? 'get' : 'get'
    // if you don't pass in a path to the method decorator, we'll just use the base route
    // what if someone has multiple no argument methods of the same type in a single controller?
    // we need to throw an error there
    if (pathDecorator) {
      this.path = getPath(pathDecorator, this.current.typeChecker)
    } else {
      this.path = ''
    }
  }

  private getMethodResponses(): Array<Tsoa.Response & { status: number }> {
    const decorators = this.getDecoratorsByIdentifier(this.node, 'SwaggerResponse')
    if (!decorators || !decorators.length) {
      return []
    }

    return decorators.map((decorator) => {
      const [status, description, example, produces] = getDecoratorValues(decorator, this.current.typeChecker)

      return {
        description: description || '',
        examples: example === undefined ? undefined : [example],
        name: status || '200',
        status: parseInt(status, 10),
        produces: this.getProducesAdapter(produces),
        schema: this.getSchemaFromDecorator(decorator, 0),
        headers: this.getHeadersFromDecorator(decorator, 1),
      } as Tsoa.Response & { status: number }
    })
  }

  private schemaToParameter(schema: Tsoa.Type, inType: 'body' | 'query'): Tsoa.Parameter[] {
    if (schema.dataType === 'intersection' || schema.dataType === 'union') {
      return schema.types.reduce<Tsoa.Parameter[]>((prev, curr) => {
        return prev.concat(this.schemaToParameter(curr, inType))
      }, [])
    }
    if (schema.dataType === 'nestedObjectLiteral' || schema.dataType === 'refObject') {
      return schema.properties.map((prop) => {
        return {
          description: prop.description,
          in: inType === 'body' ? 'body-prop' : 'query',
          parameterName: prop.name,
          name: prop.name,
          required: prop.required,
          type: prop.type,
          validators: prop.validators,
          deprecated: false,
        }
      })
    }
    return []
  }

  private getParameters(type: 'body' | 'query'): Array<Tsoa.Parameter> {
    const queryParamsDecorators = this.getDecoratorsByIdentifier(
      this.node,
      type === 'body' ? 'SwaggerBody' : 'SwaggerQueryParams',
    )
    if (!queryParamsDecorators || !queryParamsDecorators.length) {
      return []
    }
    const firstDecorator = queryParamsDecorators[0]
    const schema = this.getSchemaFromDecorator(firstDecorator, 0)

    if (!schema) {
      return []
    }

    return this.schemaToParameter(schema, type)
  }

  private getPathParameters(path: string): Array<Tsoa.Parameter> {
    // find params, which could be ':id' or '{id}'
    const params = path.match(/(:|\{)([^}]+)(\}|$)/g)
    if (!params) {
      return []
    }
    return params.map((param) => {
      const name = param.replace(/[:{}]/g, '')
      return {
        description: name,
        in: 'path',
        name,
        parameterName: name,
        required: true,
        type: { dataType: 'string' },
        validators: {},
        deprecated: false,
      }
    })
  }

  private getHeadersFromDecorator({ parent: expression }: ts.Identifier, headersIndex: number) {
    if (!ts.isCallExpression(expression)) {
      return undefined
    }
    return getHeaderType(expression.typeArguments, headersIndex, this.current)
  }

  private getSchemaFromDecorator({ parent: expression }: ts.Identifier, schemaIndex: number): Tsoa.Type | undefined {
    if (!ts.isCallExpression(expression) || !expression.typeArguments?.length) {
      return undefined
    }
    return new TypeResolver(expression.typeArguments[schemaIndex], this.current).resolve()
  }

  private getIsDeprecated() {
    if (isExistJSDocTag(this.node, (tag) => tag.tagName.text === 'deprecated')) {
      return true
    }
    const depDecorators = this.getDecoratorsByIdentifier(this.node, 'Deprecated')
    if (!depDecorators || !depDecorators.length) {
      return false
    }
    if (depDecorators.length > 1) {
      throw new GenerateMetadataError(`Only one Deprecated decorator allowed in '${this.getCurrentLocation()}' method.`)
    }

    return true
  }

  private getOperationId() {
    const opDecorators = this.getDecoratorsByIdentifier(this.node, 'OperationId')
    if (!opDecorators || !opDecorators.length) {
      return undefined
    }
    if (opDecorators.length > 1) {
      throw new GenerateMetadataError(
        `Only one OperationId decorator allowed in '${this.getCurrentLocation()}' method.`,
      )
    }

    const values = getDecoratorValues(opDecorators[0], this.current.typeChecker)
    return values && values[0]
  }

  private getTags() {
    const tagsDecorators = this.getDecoratorsByIdentifier(this.node, 'Tags')
    if (!tagsDecorators || !tagsDecorators.length) {
      return this.parentTags
    }
    if (tagsDecorators.length > 1) {
      throw new GenerateMetadataError(`Only one Tags decorator allowed in '${this.getCurrentLocation()}' method.`)
    }

    const tags = getDecoratorValues(tagsDecorators[0], this.current.typeChecker)
    if (tags && this.parentTags) {
      tags.push(...this.parentTags)
    }
    return tags
  }

  private getSecurity(): Tsoa.Security[] {
    const noSecurityDecorators = this.getDecoratorsByIdentifier(this.node, 'NoSecurity')
    const securityDecorators = this.getDecoratorsByIdentifier(this.node, 'Security')

    if (noSecurityDecorators?.length > 1) {
      throw new GenerateMetadataError(`Only one NoSecurity decorator allowed in '${this.getCurrentLocation()}' method.`)
    }

    if (noSecurityDecorators?.length && securityDecorators?.length) {
      throw new GenerateMetadataError(
        `NoSecurity decorator cannot be used in conjunction with Security decorator in '${this.getCurrentLocation()}' method.`,
      )
    }

    if (noSecurityDecorators?.length) {
      return []
    }

    if (!securityDecorators || !securityDecorators.length) {
      return this.parentSecurity || []
    }

    return securityDecorators.map((d) => getSecurites(d, this.current.typeChecker))
  }

  private getIsHidden() {
    const hiddenDecorators = this.getDecoratorsByIdentifier(this.node, 'Hidden')
    if (!hiddenDecorators || !hiddenDecorators.length) {
      return !!this.isParentHidden
    }

    if (this.isParentHidden) {
      throw new GenerateMetadataError(
        `Hidden decorator cannot be set on '${this.getCurrentLocation()}' it is already defined on the controller`,
      )
    }

    if (hiddenDecorators.length > 1) {
      throw new GenerateMetadataError(`Only one Hidden decorator allowed in '${this.getCurrentLocation()}' method.`)
    }

    return true
  }

  private getDecoratorsByIdentifier(node: ts.Node, id: string) {
    return getDecorators(node, (identifier) => identifier.text === id)
  }

  private getProducesAdapter(produces?: string[] | string): string[] | undefined {
    if (Array.isArray(produces)) {
      return produces
    } else if (typeof produces === 'string') {
      return [produces]
    }
    return
  }
}
