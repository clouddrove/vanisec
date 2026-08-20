// Request builders shared by the route tests.
//
// The route handlers are plain functions over NextRequest, so they can be
// called directly. Nothing here starts a server, which keeps the suite free of
// ports, timing and network.

import { NextRequest } from 'next/server'

export const ORIGIN = 'http://vanisec.test'

export function jsonRequest(
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  const payload = JSON.stringify(body)
  return new NextRequest(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(payload)),
      ...headers,
    },
    body: payload,
  })
}

// A body that is not JSON at all, to reach the parse-error branch.
export function rawRequest(
  path: string,
  body: string,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  })
}

export function getRequest(path: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`, { method: 'GET', headers })
}

// The [id] route receives its params as a promise, matching the App Router.
export function routeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

export async function jsonBody<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}
