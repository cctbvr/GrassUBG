// Vercel serverless function: /api/uv/?url=<encoded-target>
// Fetches target URL, strips X-Frame-Options and CSP frame-ancestors, returns proxy response.

export default async function handler(req, res) {
  // Read url param from either query or full request URL
  const urlParam = req.query.url || (req.url && new URL(req.url, `https://${req.headers.host}`).searchParams.get('url'));
  if (!urlParam) return res.status(400).send('Missing url query parameter');

  let target;
  try {
    target = decodeURIComponent(urlParam);
  } catch (e) {
    target = urlParam;
  }

  try {
    // Basic validation: only allow http(s)
    if (!/^https?:\/\//i.test(target)) {
      return res.status(400).send('Invalid target URL (must start with http:// or https://)');
    }

    const upstream = await fetch(target, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (compatible; grass-proxy/1.0)'
      },
      redirect: 'follow'
    });

    const buf = await upstream.arrayBuffer();

    // Build outgoing headers while stripping frame-blocking ones
    const outHeaders = {};
    upstream.headers.forEach((v, k) => {
      const key = k.toLowerCase();
      // Remove headers that block embedding
      if (key === 'x-frame-options') return;
      if (key === 'content-security-policy' || key === 'content-security-policy-report-only') {
        // Remove frame-ancestors directive from CSP header if present
        const modified = v.replace(/frame-ancestors[^;]*;?/ig, '').trim();
        if (modified) outHeaders[k] = modified;
        return;
      }
      // Skip hop-by-hop headers
      if (['transfer-encoding','connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer','upgrade','content-encoding'].includes(key)) return;
      outHeaders[k] = v;
    });

    // Add permissive CORS and ensure we don't re-add frame deny
    outHeaders['access-control-allow-origin'] = '*';

    // If no content-type provided, fallback to text/html
    if (!outHeaders['content-type']) outHeaders['content-type'] = 'text/html; charset=utf-8';

    // Set headers on response
    Object.entries(outHeaders).forEach(([k, v]) => {
      if (v != null && v !== '') res.setHeader(k, v);
    });

    // Return the upstream status and body
    res.status(upstream.status).send(Buffer.from(buf));
  } catch (err) {
    console.error('Proxy error', err);
    res.status(502).send('Proxy error: ' + String(err && err.message ? err.message : err));
  }
}
