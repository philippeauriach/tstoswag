import { OpenAPIV3_1 } from 'openapi-types';
import { JSONSchema, ParsedMethod } from '../types';
export declare const generateSwagger: ({ methods, schema, info, }: {
    methods: ParsedMethod[];
    schema: JSONSchema;
    info: Partial<{
        title: string;
        version: string;
        description: string;
    }>;
}) => (Omit<Omit<import("openapi-types").OpenAPIV3.Document<{}>, "paths" | "components">, "info" | "paths" | "components" | "servers" | "webhooks" | "jsonSchemaDialect"> & {
    info: OpenAPIV3_1.InfoObject;
    jsonSchemaDialect?: string | undefined;
    servers?: OpenAPIV3_1.ServerObject[] | undefined;
} & Pick<{
    paths: OpenAPIV3_1.PathsObject<{}, {}>;
    webhooks: Record<string, OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.PathItemObject<{}>>;
    components: OpenAPIV3_1.ComponentsObject;
}, "paths"> & Omit<Partial<{
    paths: OpenAPIV3_1.PathsObject<{}, {}>;
    webhooks: Record<string, OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.PathItemObject<{}>>;
    components: OpenAPIV3_1.ComponentsObject;
}>, "paths">) | (Omit<Omit<import("openapi-types").OpenAPIV3.Document<{}>, "paths" | "components">, "info" | "paths" | "components" | "servers" | "webhooks" | "jsonSchemaDialect"> & {
    info: OpenAPIV3_1.InfoObject;
    jsonSchemaDialect?: string | undefined;
    servers?: OpenAPIV3_1.ServerObject[] | undefined;
} & Pick<{
    paths: OpenAPIV3_1.PathsObject<{}, {}>;
    webhooks: Record<string, OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.PathItemObject<{}>>;
    components: OpenAPIV3_1.ComponentsObject;
}, "components"> & Omit<Partial<{
    paths: OpenAPIV3_1.PathsObject<{}, {}>;
    webhooks: Record<string, OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.PathItemObject<{}>>;
    components: OpenAPIV3_1.ComponentsObject;
}>, "components">);
