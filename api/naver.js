const axios = require('axios');

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { query, category = 'all', sort = 'sim', start = 1, display = 50 } = req.query;
  
  // 환경변수 확인
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('네이버 API 키가 설정되지 않았습니다.');
    return res.status(500).json({ 
      error: '네이버 API 키가 설정되지 않았습니다.',
      message: 'Vercel 환경변수를 확인해주세요.'
    });
  }

  try {
    // 카테고리별 검색어 설정
    const categoryQueries = {
      'electronics': '전자제품',
      'fashion': '패션',
      'home': '생활용품',
      'beauty': '화장품',
      'sports': '스포츠',
      'books': '도서',
      'food': '음식',
      'all': query || '인기상품'
    };

    const searchQuery = categoryQueries[category] || query || '인기상품';

    // 네이버 쇼핑 API 호출
    const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
        'User-Agent': 'Mozilla/5.0 (compatible; NaverShoppingBot/1.0)'
      },
      params: {
        query: searchQuery,
        display: Math.min(display, 100), // 최대 100개
        start: start,
        sort: sort
      },
      timeout: 10000
    });

    // 데이터 가공
    const items = response.data.items.map((item, index) => ({
      rank: parseInt(start) + index,
      title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
      price: parseInt(item.lprice) || 0,
      image: item.image,
      link: item.link,
      mallName: item.mallName || '네이버쇼핑',
      category: item.category1 || category,
      brand: item.brand || '',
      maker: item.maker || ''
    }));

    console.log(`네이버 API 성공: ${items.length}개 상품 조회`);

    res.status(200).json({
      success: true,
      total: response.data.total,
      start: response.data.start,
      display: response.data.display,
      items: items,
      category: category,
      query: searchQuery
    });

  } catch (error) {
    console.error('네이버 API 호출 실패:', error.message);
    
    // 구체적인 오류 메시지 제공
    let errorMessage = '네이버 API 호출에 실패했습니다.';
    if (error.response) {
      errorMessage = `API 오류 (${error.response.status}): ${error.response.data?.errorMessage || '알 수 없는 오류'}`;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'API 호출 시간 초과';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
}
