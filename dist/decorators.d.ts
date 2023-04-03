/**
 * can be used as a decorator on a class or a method
 * Parameters will be generated from the url when written as `:id`
 * @param path the path of the endpoint
 */
export declare function SwaggerPath(path: string): (target: unknown, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
/**
 * can be used as a decorator on a class or a method
 */
export declare function SwaggerTag(...tag: string[]): (target: unknown, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
export declare function SwaggerMethod(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'): (target: unknown, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
export declare function SwaggerQueryParams<T>(): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => any;
export declare function SwaggerBody<T>(): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => any;
export declare function SwaggerOperationId(operationId: string): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => any;
export declare function SwaggerResponse<T>(status?: number, description?: string): (target: unknown, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
