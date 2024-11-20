/* global BRANCH, VERSION, COMMITHASH, SENTRY_RELEASE */

import { Toucan, RewriteFrames } from 'toucan-js'
import { Logging } from '@web3-storage/worker-utils/loki'

/**
 * @typedef {import('./bindings').Env} Env
 * @typedef {import('.').Ctx} Ctx
 */

/**
 * @param {Request} request
 * @param {Env} env
 * @param {import('.').Ctx} ctx
 */
export function envAll (request, env, ctx) {
  env.IPFS_GATEWAY_HOSTNAME = env.GATEWAY_HOSTNAME
  env.IPNS_GATEWAY_HOSTNAME = env.GATEWAY_HOSTNAME.replace('ipfs', 'ipns')

  // These values are replaced at build time by esbuild `define`
  env.BRANCH = BRANCH
  env.VERSION = VERSION
  env.COMMITHASH = COMMITHASH
  env.SENTRY_RELEASE = SENTRY_RELEASE

  env.sentry = getSentry(request, env, ctx)

  env.log = new Logging(request, ctx, {
    // @ts-ignore TODO: url should be optional together with token
    url: env.LOKI_URL,
    token: env.LOKI_TOKEN,
    debug: Boolean(env.DEBUG),
    version: env.VERSION,
    commit: env.COMMITHASH,
    branch: env.BRANCH,
    worker: 'w3s.link',
    env: env.ENV,
    sentry: env.sentry,
    logDataTransformer: (log) =>{
      /**
       * removed: metadata.request.cf, metadata.request.headers and metadata.response.headers
       */
      return {
        ...log,
        metadata: {
          request: {
            url: log.metadata.request.url,
            method: log.metadata.request.method,
          },
          cloudflare_worker: log.metadata.cloudflare_worker,
          response: {
            "status_code": log.metadata.response?.status_code,
            "duration": log.metadata.response?.duration
          }
        }
      }
    }
  })
  env.log.time('request')
}

/**
 * Get sentry instance if configured
 *
 * @param {Request} request
 * @param {Env} env
 * @param {Ctx} ctx
 */
function getSentry (request, env, ctx) {
  if (!env.SENTRY_DSN) {
    return
  }

  return new Toucan({
    request,
    dsn: env.SENTRY_DSN,
    context: ctx,
    requestDataOptions: {
      allowedHeaders: ['user-agent'],
      allowedSearchParams: /(.*)/
    },
    integrations: [new RewriteFrames({ root: '/' })],
    debug: false,
    environment: env.ENV || 'dev',
    release: env.SENTRY_RELEASE
  })
}
