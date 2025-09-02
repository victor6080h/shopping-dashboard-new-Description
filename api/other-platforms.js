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
    const { query = '인기상품', category = '', platform = 'gmarket' } = req.query;
    
    // 기타 플랫폼 Mock 데이터 생성
    const platforms = {
      gmarket: { name: 'G마켓', baseUrl: 'http://item.gmarket.co.kr' },
      auction: { name: '옥션', baseUrl: 'http://itempage3.auction.co.kr' },
      interpark: { name: '인터파크', baseUrl: 'http://shopping.interpark.com' },
      lotte: { name: '롯데ON', baseUrl: 'https://www.lotte.com' },
      ssg: { name: 'SSG.COM', baseUrl: 'https://www.ssg.com' }
    };

    const categories = ['전자제품', '패션의류', '생활용품', '식품', '화장품', '도서', '취미게임', '육아용품', '자동차', '스포츠', '건강식품', '가구인테리어'];
    const products = [];

    // 여러 플랫폼의 상품을 믹스하여 200위까지 생성
    const platformKeys = Object.keys(platforms);
    
    for (let i = 1; i <= 200; i++) {
      const currentPlatform = platformKeys[i % platformKeys.length];
      const platformInfo = platforms[currentPlatform];
      
      const product = {
        rank: i,
        title: `${platformInfo.name} 인기상품 ${i}위`,
        price: Math.floor(Math.random() * 400000) + 8000,
        originalPrice: Math.floor(Math.random() * 500000) + 50000,
        discountRate: Math.floor(Math.random() * 60) + 5,
        image: `https://picsum.photos/300/250?random=${i + 4000}`,
        link: `${platformInfo.baseUrl}/product/${Math.floor(Math.random() * 1000000)}`,
        mall: platformInfo.name,
        rating: (3.8 + Math.random() * 1.2).toFixed(1),
        reviewCount: Math.floor(Math.random() * 3000) + 50,
        category: categories[Math.floor(Math.random() * categories.length)],
        platform: 'other',
        platformType: currentPlatform,
        freeShipping: Math.random() > 0.4, // 60% 확률로 무료배송
        deliveryDays: Math.floor(Math.random() * 5) + 1, // 1-5일 배송
        productId: Math.floor(Math.random() * 1000000),
        
        // 플랫폼별 특별 혜택
        specialOffer: getSpecialOffer(currentPlatform, i),
        memberDiscount: Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 5 : 0
      };
      
      // 할인가 계산
      if (product.discountRate > 0) {
        product.price = Math.floor(product.originalPrice * (100 - product.discountRate) / 100);
      }
      
      products.push(product);
    }

    // 카테고리 필터 적용
    let filteredProducts = products;
    if (category) {
      filteredProducts = products.filter(p => p.category === category);
    }

    // 정렬 (인기순 기본)
    filteredProducts.sort((a, b) => a.rank - b.rank);

    res.status(200).json({
      success: true,
      total: filteredProducts.length,
      products: filteredProducts,
      platform: 'other',
      supportedPlatforms: Object.keys(platforms),
      note: '지마켓, 옥션, 인터파크, 롯데ON, SSG 통합 데이터',
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('기타 플랫폼 API 오류:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      platform: 'other',
      lastUpdate: new Date().toISOString()
    });
  }
}

// 플랫폼별 특별 혜택 생성
function getSpecialOffer(platform, rank) {
  const offers = {
    gmarket: ['스마일클럽 추가할인', 'G마켓 카드 할인', '무료배송'],
    auction: ['옥션클럽 혜택', '경매 참여 가능', '빠른배송'],
    interpark: ['적립금 5배', '인터파크 카드 할인', '당일배송'],
    lotte: ['L.POINT 적립', '롯데카드 할인', '매장 픽업 가능'],
    ssg: ['신세계포인트 적립', 'SSG카드 할인', '새벽배송']
  };
  
  const platformOffers = offers[platform] || ['특가 혜택'];
  return rank <= 50 ? platformOffers[Math.floor(Math.random() * platformOffers.length)] : null;
}
