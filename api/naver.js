export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q = '인기상품', sort = 'sim', start = '1', display = '100' } = req.query;
  const cid = process.env.NAVER_CLIENT_ID;
  const csec = process.env.NAVER_CLIENT_SECRET;

  if (!cid || !csec) {
    return res.status(503).json({ success: false, error: 'NAVER API 키가 설정되지 않았습니다.' });
  }

  const endpoint = 'https://openapi.naver.com/v1/search/shop.json';
  const headers = {
    'X-Naver-Client-Id': cid,
    'X-Naver-Client-Secret': csec
  };

  try {
    const url = `${endpoint}?query=${encodeURIComponent(q)}&display=${display}&start=${start}&sort=${sort}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`Naver API ${r.status}`);
    const d = await r.json();

    const norm = (it) => ({
      title: (it.title || '').replace(/<[^>]+>/g, ''),
      link: it.link,
      image: it.image,
      lprice: Number(it.lprice || 0),
      hprice: Number(it.hprice || 0),
      price: Number(it.lprice || it.hprice || 0),
      mall: it.mallName || '네이버쇼핑',
      brand: it.brand || it.maker || '',
      productId: it.productId,
      productType: it.productType,
      category1: it.category1, category2: it.category2, category3: it.category3, category4: it.category4,
      rating: 4.2, // 네이버 검색 응답에 평점이 직접 포함되진 않으므로 보수적으로 표시
      reviewCount: 0
    });

    const products = (d.items || []).map(norm);
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({ success: true, products });

  } catch (e) {
    console.error('NAVER API error', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
