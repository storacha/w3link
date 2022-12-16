/* eslint-env serviceworker, browser */

import { CID } from 'multiformats/cid'
import pRetry from 'p-retry'

import { InvalidUrlError } from './errors.js'

const PRODUCT_URL = 'https://web3.storage/products/w3link/'
const GOODBITS_BYPASS_TAG = 'https://w3s.link/tags/bypass-default-csp'
const IPFS_GATEWAYS = [
  'https://*.w3s.link',
  'https://*.nftstorage.link',
  'https://*.dweb.link',
  'https://ipfs.io/ipfs/',
]
const DOTSTORAGE_APIS = ['https://*.web3.storage', 'https://*.nft.storage']

/**
 * Handle gateway request
 *
 * @param {Request} request
 * @param {import('./env').Env} env
 */
export async function gatewayGet (request, env) {
  // Redirect to product page
  if (!request.url.includes('ipfs') && !request.url.includes('ipns')) {
    return Response.redirect(
      PRODUCT_URL,
      302
    )
  }

  // Redirect if ipns
  if (request.url.includes(env.IPNS_GATEWAY_HOSTNAME)) {
    return Response.redirect(
      request.url.replace(env.IPNS_GATEWAY_HOSTNAME, 'ipns.dweb.link'),
      302
    )
  }

  const response = await env.EDGE_GATEWAY.fetch(request.url, {
    headers: request.headers,
    cf: {
      ...request.cf || {},
      // @ts-ignore custom entry in cf object
      onlyIfCachedGateways: JSON.stringify(['https://nftstorage.link'])
    }
  })

  // Validation layer - CSP bypass
  const resourceCid = decodeURIComponent(
    response.headers.get('etag') || getCidFromSubdomainUrl(new URL(request.url))
  )
  const goodbitsTags = await getTagsFromGoodbitsList(
    env.GOODBITSLIST,
    resourceCid
  )
  if (goodbitsTags.includes(GOODBITS_BYPASS_TAG)) {
    return response
  }

  return getTransformedResponseWithCspHeaders(response)
}

/**
 * Transforms response with custom headers.
 * Content-Security-Policy header specified to only allow requests within same origin.
 *
 * @param {Response} response
 */
function getTransformedResponseWithCspHeaders (response) {
  const clonedResponse = new Response(response.body, response)

  clonedResponse.headers.set(
    'content-security-policy',
    `default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: ${IPFS_GATEWAYS.join(' ')} ${DOTSTORAGE_APIS.join(' ')} https://*.githubusercontent.com; form-action 'self'; navigate-to 'self'; connect-src 'self' blob: data: ${IPFS_GATEWAYS.join(' ')} ${DOTSTORAGE_APIS.join(' ')}`
  )

  return clonedResponse
}

/**
 * Get a given entry from the goodbits list if CID exists, and return tags
 *
 * @param {KVNamespace} datastore
 * @param {string} cid
 */
async function getTagsFromGoodbitsList (datastore, cid) {
  if (!datastore || !cid) {
    return []
  }

  const goodbitsEntry = await pRetry(() => datastore.get(cid), { retries: 5 })

  if (goodbitsEntry) {
    const { tags } = JSON.parse(goodbitsEntry)
    return Array.isArray(tags) ? tags : []
  }

  return []
}

/**
 * Parse subdomain URL and return cid.
 *
 * @param {URL} url
 */
export function getCidFromSubdomainUrl (url) {
  // Replace "ipfs-staging" by "ipfs" if needed
  const host = url.hostname.replace('ipfs-staging', 'ipfs')
  const splitHost = host.split('.ipfs.')

  if (!splitHost.length) {
    throw new InvalidUrlError(url.hostname)
  }

  let cid
  try {
    cid = CID.parse(splitHost[0])
  } catch (/** @type {any} */ err) {
    throw new InvalidUrlError(`invalid CID: ${splitHost[0]}: ${err.message}`)
  }

  return cid.toV1().toString()
}
