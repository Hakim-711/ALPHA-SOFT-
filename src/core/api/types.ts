export interface FrappeListResponse<T> {
  data: T[]
}

export interface FrappeDocResponse<T> {
  data: T
}

export interface FrappeErrorResponse {
  exception?: string
  exc?: string
  message?: string
  _server_messages?: string
}

