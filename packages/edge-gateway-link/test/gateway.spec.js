import { test, getMiniflare } from './utils/setup.js'
import http from 'node:http'

test.before(async () => {
  const ucantoServer = http.createServer((req, res) => {
    if (req.method === 'POST') {
      res.setHeader('X-Proxied-By', 'TestUcantoServer')
      res.end()
    } else {
      res.statusCode = 405
      res.end('Method Not Allowed')
    }
  })
  await new Promise(resolve => ucantoServer.listen(8000, () => resolve(undefined)))
})

test.beforeEach((t) => {
  // Create a new Miniflare environment for each test
  t.context = {
    mf: getMiniflare()
  }
})

test('Gets content from binding', async (t) => {
  const { mf } = t.context

  const response = await mf.dispatchFetch(
    'https://bafkreidyeivj7adnnac6ljvzj2e3rd5xdw3revw4da7mx2ckrstapoupoq.ipfs.localhost:8787'
  )
  await response.waitUntil()
  t.is(await response.text(), 'Hello w3s.link! 😎')

  // CSP
  const csp = response.headers.get('content-security-policy') || ''
  t.true(csp.includes("default-src 'self' 'unsafe-inline' 'unsafe-eval'"))
  t.true(csp.includes('blob: data'))
  t.true(csp.includes("form-action 'self'; navigate-to 'self';"))
})

test('redirects from binding', async (t) => {
  const { mf } = t.context
  const cid = 'bafybeiet3ym4yxqaqxbrhyvhaddi7wrglpkwoqjg5vwlsifv6duruw4vz4'

  const response = await mf.dispatchFetch(`https://${cid}.ipfs.localhost:8787`)

  t.is(response.status, 307)
})

test('Gets content with no csp header when goodbits csp bypass tag exists', async (t) => {
  const { mf } = t.context
  const cid = 'bafkreidyeivj7adnnac6ljvzj2e3rd5xdw3revw4da7mx2ckrstapoupor'

  // add the CID to the goodbits list
  const goodbitsListKv = await mf.getKVNamespace('GOODBITSLIST')
  await goodbitsListKv.put(
    cid,
    JSON.stringify({
      tags: ['https://w3s.link/tags/bypass-default-csp']
    })
  )

  const response = await mf.dispatchFetch(`https://${cid}.ipfs.localhost:8787`)
  await response.waitUntil()
  t.is(await response.text(), 'Hello w3s.link! 😎')

  // CSP does not exist
  const csp = response.headers.get('content-security-policy')
  t.falsy(csp)
})

test('Gets content with csp header when goodbits csp bypass tag does not exist', async (t) => {
  const { mf } = t.context
  const cid = 'bafkreidyeivj7adnnac6ljvzj2e3rd5xdw3revw4da7mx2ckrstapoupos'

  // add the CID to the goodbits list
  const goodbitsListKv = await mf.getKVNamespace('GOODBITSLIST')
  await goodbitsListKv.put(
    cid,
    JSON.stringify({
      tags: ['foo-bar-tag']
    })
  )

  const response = await mf.dispatchFetch(`https://${cid}.ipfs.localhost:8787`)
  await response.waitUntil()
  t.is(await response.text(), 'Hello w3s.link! 😎')

  // CSP exists
  const csp = response.headers.get('content-security-policy')
  t.truthy(csp)
})

test('Proxies POST requests to the UCANTO Server', async t => {
  const res = await t.context.mf.dispatchFetch('http://localhost:8787', {
    method: 'POST',
    body: JSON.stringify({ key: 'value' })
  })

  t.is(res.headers.get('X-Proxied-By'), 'TestUcantoServer')
  t.true(res.ok)
})
