/* eslint-env serviceworker, browser */

/**
 * Handle gateway request
 *
 * @param {Request} request
 * @param {import('./env').Env} env
 */
export async function gatewayGet (request, env) {
  // Redirect if ipns
  if (request.url.includes(env.IPNS_GATEWAY_HOSTNAME)) {
    return Response.redirect(
      request.url.replace(env.IPNS_GATEWAY_HOSTNAME, 'ipns.dweb.link'),
      302
    )
  }

  return await env.EDGE_GATEWAY.fetch(request.url, {
    headers: request.headers,
    cf: {
      ...request.cf || {},
      // @ts-ignore custom entry in cf object
      onlyIfCachedGateways: JSON.stringify(['https://nftstorage.link'])
    }
  })
}
