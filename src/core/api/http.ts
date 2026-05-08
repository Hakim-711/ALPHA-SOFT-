import axios from 'axios'
import { env } from '@/core/config/env'
import type { FrappeErrorResponse } from './types'

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function buildApiRoot(apiBaseUrl: string) {
  if (!apiBaseUrl) {
    return '/api'
  }

  const trimmed = trimTrailingSlash(apiBaseUrl)

  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const apiRoot = buildApiRoot(env.apiBaseUrl)

export const http = axios.create({
  baseURL: apiRoot,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function parseServerMessages(value?: string) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown[]

    return parsed
      .map((item) => {
        if (typeof item !== 'string') {
          return undefined
        }

        try {
          const nested = JSON.parse(item) as { message?: string }
          return nested.message ? stripHtml(nested.message) : stripHtml(item)
        } catch {
          return stripHtml(item)
        }
      })
      .filter((message): message is string => Boolean(message))
  } catch {
    return [stripHtml(value)]
  }
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError<FrappeErrorResponse>(error)) {
      return Promise.reject(error instanceof Error ? error : new Error('Unexpected API error'))
    }

    const data = error.response?.data
    const serverMessages = parseServerMessages(data?._server_messages)
    const message =
      serverMessages[0] ??
      data?.exception ??
      data?.exc ??
      data?.message ??
      error.message ??
      'Unexpected API error'

    return Promise.reject(new Error(stripHtml(message)))
  },
)
