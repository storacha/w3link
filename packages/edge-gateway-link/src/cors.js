/* eslint-env serviceworker */

/**
 * @param {import('itty-router').RouteHandler} handler
 * @returns {import('itty-router').RouteHandler}
 */
export function withCorsHeaders (handler) {
  /**
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  return async (request, ...rest) => {
    const response = await handler(request, ...rest)
    return addCorsHeaders(request, response)
  }
}

/**
 * @param {Request} request
 * @param {Response} response
 * @returns {Response}
 */
export function addCorsHeaders (request, response) {
  // Clone the response so that it's no longer immutable (like if it comes from cache or fetch)
  response = new Response(response.body, response)
  const origin = request.headers.get('origin')
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Vary', 'Origin')
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }
  response.headers.set('Access-Control-Expose-Headers', 'Link')
  return response
}

/**
 * Handle OPTIONS requests in the proxy itself by returning a 204 No Content response with CORS headers.
 *
 * @param {Request} request
 * @returns {Response}
 */
export function corsPreflightRequest (request) {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return new Response(null, { headers, status: 204 })
}
