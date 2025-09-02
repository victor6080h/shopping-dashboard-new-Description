export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) {
      res.status(400).send('missing url');
      return;
    }
    const target = decodeURIComponent(url);
    const r = await fetch(target, { redirect: 'follow' });
    if (!r.ok) {
      res.status(r.status).send('fetch failed');
      return;
    }
    const ct = r.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    const buf = Buffer.from(await r.arrayBuffer());
    res.status(200).send(buf);
  } catch (e) {
    res.status(500).send('proxy error');
  }
}
