/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  SwaggerMethod,
  SwaggerQueryParams,
  SwaggerBody,
  SwaggerResponse,
  SwaggerPath,
  SwaggerTag,
} from '../../src/decorators'

type Media =
  | {
      type: 'image'
      format: 'jpeg' | 'png' | 'gif' | 'svg'
      url: string
      width: number
      height: number
    }
  | {
      type: 'video'
      url: string
      duration: number
    }

export type Post = {
  id: string
  title: string
  content: string
  mainMedia?: Media
  media?: Media[]
  urls: string[]
}

export type User = {
  id: string
  name: string
  age?: number
  createdAt: Date
  profilePicture?: Media[]
  posts?: Post[]
}

//TODO: add support for Pick
// type UserCreate = Pick<User, 'name' | 'age'>
type UserCreate = {
  name: string
  age?: number
}

type FilterQueryParams = {
  limit?: number
  offset: number
}

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
  @SwaggerPath('/:id/')
  @SwaggerResponse<User>()
  static getById() {
    return {}
  }

  @SwaggerMethod('POST')
  @SwaggerQueryParams<FilterQueryParams>()
  @SwaggerBody<UserCreate>()
  @SwaggerResponse<User>(200)
  @SwaggerResponse(403)
  static create() {
    return {}
  }
}
