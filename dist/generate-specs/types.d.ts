import { Config } from './config';
import { Swagger } from './swagger';
export type UnspecifiedObject = {
    [key: string]: unknown;
};
export interface ExtendedSpecConfig extends SpecConfig {
    entryFile: Config['entryFile'];
    noImplicitAdditionalProperties: Exclude<Config['noImplicitAdditionalProperties'], undefined>;
    controllerPathGlobs?: Config['controllerPathGlobs'];
}
export interface SpecConfig {
    /**
     * Generated SwaggerConfig.json will output here
     */
    outputDirectory: string;
    /**
     * API host, expressTemplate.g. localhost:3000 or myapi.com
     */
    host?: string;
    /**
     * Base-name of swagger.json or swagger.yaml.
     *
     * @default: "swagger"
     */
    specFileBaseName?: string;
    /**
     * API version number; defaults to npm package version
     */
    version?: string;
    /**
     * Major OpenAPI version to generate; defaults to version 2 when not specified
     * Possible values:
     *  - 2: generates OpenAPI version 2.
     *  - 3: generates OpenAPI version 3.
     */
    specVersion?: Swagger.SupportedSpecMajorVersion;
    /**
     * API name; defaults to npm package name
     */
    name?: string;
    /**
     * API description; defaults to npm package description
     */
    description?: string;
    /**
     * Link to the page that describes the terms of service.
     * Must be in the URL format.
     */
    termsOfService?: string;
    /**
     * Contact Information
     */
    contact?: {
        /**
         * The identifying name of the contact person/organization.
         * @default npm package author
         */
        name?: string;
        /**
         * The email address of the contact person/organization.
         * @default npm package author email
         */
        email?: string;
        /**
         * API Info url
         * The URL pointing to the contact information.
         * @default npm package author url
         */
        url?: string;
    };
    /**
     * API license; defaults to npm package license
     */
    license?: string;
    /**
     * Base API path; e.g. the 'v1' in https://myapi.com/v1
     */
    basePath?: string;
    /**
     * Extend generated swagger spec with this object
     * Note that generated properties will always take precedence over what get specified here
     */
    spec?: unknown;
    /**
     * Alter how the spec is merged to generated swagger spec.
     * Possible values:
     *  - 'immediate' is overriding top level elements only thus you can not append a new path or alter an existing value without erasing same level elements.
     *  - 'recursive' proceed to a deep merge and will concat every branches or override or create new values if needed. @see https://www.npmjs.com/package/merge
     *  - 'deepmerge' uses `deepmerge` to merge, which will concat object branches and concat arrays as well @see https://www.npmjs.com/package/deepmerge
     * The default is set to immediate so it is not breaking previous versions.
     * @default 'immediate'
     */
    specMerging?: 'immediate' | 'recursive' | 'deepmerge';
    /**
     * Template string for generating operation ids.
     * This should be a valid handlebars template and is provided
     * with the following context:
     *   - 'controllerName' - String name of controller class.
     *   - 'method' - Tsoa.Method object.
     *
     * @default '{{titleCase method.name}}'
     */
    operationIdTemplate?: string;
    /**
     * Security Definitions Object
     * A declaration of the security schemes available to be used in the
     * specification. This does not enforce the security schemes on the operations
     * and only serves to provide the relevant details for each scheme.
     */
    securityDefinitions?: {
        [name: string]: Swagger.SecuritySchemes;
    };
    /**
     * Swagger Tags Information for your API
     */
    tags?: Swagger.Tag[];
    yaml?: boolean;
    schemes?: Swagger.Protocol[];
    /**
     * Enable x-enum-varnames support
     * @default false
     */
    xEnumVarnames?: boolean;
    /**
     * Sets a title for inline objects for responses and requestBodies
     * This helps to generate more consistent clients
     */
    useTitleTagsForInlineObjects?: boolean;
    /**
     * Applies a default security to the entire API.
     * Can be overridden with @Security or @NoSecurity decorators on controllers or methods
     */
    rootSecurity?: Swagger.Security[];
}
