# TODO
- [ ] add in tests a swagger file validation tool
- [ ] split and cleanup code for readibility
- [ ] Add swagger summary and description using jsdoc (which get picked up by json schema)
- [ ] add ability to configure the swagger file options
- [ ] handle more complex types (Pick, Omit, etc)
- [ ] create a test with a bigger ts project (with multiple files)
- [ ] optimize the process (currently each file will get parsed to json schema multiple times)
- [ ] test with a real package
- [ ] add GH workflows
- [ ] write a proper readme
- [ ] release

## Usage 
```typescript
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

## Develop

If needed, the final swagger json file can be pasted in https://editor-next.swagger.io/ to display erros
