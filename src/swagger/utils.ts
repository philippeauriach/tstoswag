export const defaultResponseDescriptionFromCode = (code: string) => {
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
