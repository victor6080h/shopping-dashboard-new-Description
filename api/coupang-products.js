import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { query = '인기상품', category = '', limit = 200 } = req.query;
    
    // 쿠팡 파트너스 API 호출 (승인 후 활성화)
    if (process.env.COUPANG_ACCESS_KEY && process.env.COUPANG_SECRET_KEY) {
      try {
        const products = await fetchCoupangProducts(query, category, limit);
        return res.status(200).json({
          success: true,
          products: products,
          platform: 'coupang',
          lastUpdate: new Date().toISOString()
        });
      } catch (apiError) {
        console.log('쿠팡 API 오류, Mock 데이터 사용:', apiError.message);
      }
    }

    // Mock 데이터 생성 (API 승인 대기 중)
    const categories = ['전자제품', '패션의류', '생활용품', '식품', '화장품', '도서', '취미게임', '육아용품', '자동차', '스포츠', '건강식품', '가구인테리어'];
    const coupangProducts = [];

    for (let i = 1; i <= 200; i++) {
      const product = {
        rank: i,
        title: `쿠팡 베스트 ${i}위 상품`,
        price: Math.floor(Math.random() * 300000) + 5000,
        originalPrice: Math.floor(Math.random() * 400000) + 50000,
        discountRate: Math.floor(Math.random() * 70) + 10,
        image: `https://picsum.photos/300/250?random=${i + 3000}`,
        link: `https://www.coupang.com/vp/products/${Math.floor(Math.random() * 10000000)}`,
        mall: i % 3 === 0 ? '쿠팡' : `파트너${(i % 10) + 1}`,
        rating: (4.0 + Math.random() * 1).toFixed(1),
        reviewCount: Math.floor(Math.random() * 10000) + 500,
        category: categories[Math.floor(Math.random() * categories.length)],
        platform: 'coupang',
        isRocket: Math.random() > 0.3, // 70% 확률로 로켓배송
        isCoupangChoice: Math.random() > 0.8, // 20% 확률로 쿠팡초이스
        deliveryInfo: i % 4 === 0 ? '오늘출발' : '내일출발',
        freeShipping: Math.random() > 0.2, // 80% 확률로 무료배송
        productId: Math.floor(Math.random() * 10000000)
      };
      
      coupangProducts.push(product);
    }

    // 카테고리 필터 적용
    let filteredProducts = coupangProducts;
    if (category) {
      filteredProducts = coupangProducts.filter(p => p.category === category);
    }

    res.status(200).json({
      success: true,
      total: filteredProducts.length,
      products: filteredProducts,
      platform: 'coupang',
      note: '쿠팡 파트너스 API 승인 대기 중 - Mock 데이터 사용',
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('쿠팡 API 오류:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      platform: 'coupang',
      lastUpdate: new Date().toISOString()
    });
  }
}

// 쿠팡 파트너스 API 호출 함수 (승인 후 활성화)
async function fetchCoupangProducts(query, category, limit) {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  const method = 'GET';
  const url = '/v2/providers/affiliate_open_api/apis/openapi/products/search';
  const queryParams = `?keyword=${encodeURIComponent(query)}&limit=${limit}`;
  
  // HMAC 서명 생성
  const timestamp = Date.now();
  const message = `${method}${url}${queryParams}${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');

  const response = await fetch(`https://api-gateway.coupang.com${url}${queryParams}`, {
    method: method,
    headers: {
      'Authorization': `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${timestamp}, signature=${signature}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`쿠팡 API 오류: ${response.status}`);
  }

  const data = await response.json();
  
  // 쿠팡 API 응답을 우리 형식으로 변환
  return data.data?.productData?.map((item, index) => ({
    rank: index + 1,
    title: item.productName,
    price: item.productPrice,
    originalPrice: item.originalPrice,
    discountRate: Math.round(((item.originalPrice - item.productPrice) / item.originalPrice) * 100),
    image: item.productImage,
    link: item.productUrl,
    mall: '쿠팡',
    rating: (4.0 + Math.random() * 1).toFixed(1),
    reviewCount: Math.floor(Math.random() * 5000) + 100,
    category: category || '기타',
    platform: 'coupang',
    isRocket: true,
    isCoupangChoice: item.isCoupangChoice || false,
    deliveryInfo: '내일출발',
    freeShipping: true,
    productId: item.productId
  })) || [];
}
