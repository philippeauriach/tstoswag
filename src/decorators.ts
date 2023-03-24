/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * can be used as a decorator on a class or a method
 * Parameters will be generated from the url when written as `:id`
 * @param path the path of the endpoint
 */
export function SwaggerPath(path: string) {
  return function (target: unknown, propertyKey?: string, descriptor?: PropertyDescriptor) {
    return descriptor?.value ?? target
  }
}

/**
 * can be used as a decorator on a class or a method
 */
export function SwaggerTag(...tag: string[]) {
  return function (target: unknown, propertyKey?: string, descriptor?: PropertyDescriptor) {
    return descriptor?.value ?? target
  }
}

export function SwaggerMethod(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    return descriptor.value
  }
}

export function SwaggerQueryParams<T>() {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    return descriptor.value
  }
}

export function SwaggerBody<T>() {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    return descriptor.value
  }
}

export function SwaggerResponse<T>(status = 200) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    return descriptor.value
  }
}
