## Installation
```bash
yarn add tstoswag
```

## Usage 
```typescript
import { SwaggerMethod, SwaggerPath, SwaggerResponse, SwaggerTag, SwaggerBody, SwaggerQueryParams } from 'tstoswag'

@SwaggerPath('/api/users')
@SwaggerTag('Users', 'List of users')
export class RouterController {
  @SwaggerMethod('GET')
  @SwaggerResponse<Array<User>>()
  static list() {
    return {}
  }

  @SwaggerTag('User details')
  @SwaggerMethod('GET')
  @SwaggerPath('/:id')
  @SwaggerResponse<User>()
  static getById() {
    return {}
  }
  /**
   * @summary Create a user
   */
  @SwaggerMethod('POST')
  @SwaggerPath('/{id}')
  @SwaggerQueryParams<FilterQueryParams>()
  @SwaggerBody<UserCreate>()
  @SwaggerResponse<User>(200)
  @SwaggerResponse(403)
  static create() {
    return {}
  }
}
```

// package.json
```json
{
  "scripts": {
    "tstoswaglint": "tstoswag -f 'src/index.ts' --tsconfig tsconfig.json --output dist-swagger",
  }
}
```

## Develop

If needed, the final swagger json file can be pasted in https://editor-next.swagger.io/ to display erros

## Thanks

Strongly inspired (let's say derived) from the awesome work made in https://github.com/lukeautry/tsoa
