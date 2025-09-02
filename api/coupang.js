export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { check, keyword = '인기상품', limit = '200' } = req.query;
  const ak = process.env.COUPANG_ACCESS_KEY;
  const sk = process.env.COUPANG_SECRET_KEY;

  if (!ak || !sk) {
    // 체크 모드 또는 일반 호출 모두 503
    return res.status(503).json({ success:false, error:'COUPANG API 키 미설정' });
  }

  if (check) {
    return res.status(200).json({ success:true, ok:true });
  }

  try {
    // TODO: 조직 문서 기준의 정확한 Affiliate Open API 검색 엔드포인트/서명 적용
    // 예시: GET https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/search?keyword=...&limit=...
    // HMAC 서명, Authorization 헤더 구성 필요
    // 본 예시는 안전을 위해 아직 호출하지 않고, 차후 승인/문서 확인 후 활성화하십시오.

    return res.status(200).json({ success:true, products:[], note:'쿠팡 API 연동은 승인/문서 확인 후 활성화하세요.' });
  } catch (e) {
    console.error('COUPANG API error', e);
    return res.status(500).json({ success:false, error:e.message });
  }
}
