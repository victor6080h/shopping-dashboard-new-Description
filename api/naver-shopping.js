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
    const { query = '인기상품', category = '', sort = 'sim', start = 1, display = 100 } = req.query;
    
    // 네이버 쇼핑 API 호출
    const naverResponse = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=${sort}`, {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
      },
    });

    if (!naverResponse.ok) {
      throw new Error(`네이버 API 오류: ${naverResponse.status}`);
    }

    const naverData = await naverResponse.json();
    
    // 1-200위 랭킹 데이터 생성
    const products = [];
    const categories = ['전자제품', '패션의류', '생활용품', '식품', '화장품', '도서', '취미게임', '육아용품', '자동차', '스포츠', '건강식품', '가구인테리어'];
    
    // 실제 네이버 데이터와 생성된 데이터 결합
    for (let i = 0; i < 200; i++) {
      let product;
      
      if (i < naverData.items?.length) {
        // 실제 네이버 데이터 사용
        const item = naverData.items[i];
        product = {
          rank: i + 1,
          title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
          price: parseInt(item.lprice) || parseInt(item.hprice) || 0,
          image: item.image,
          link: item.link,
          mall: item.mallName || '네이버쇼핑',
          rating: (4.0 + Math.random() * 1).toFixed(1),
          reviewCount: Math.floor(Math.random() * 5000) + 100,
          category: categories[Math.floor(Math.random() * categories.length)],
          platform: 'naver',
          brand: item.brand || item.maker || '브랜드',
          productId: item.productId
        };
      } else {
        // 추가 Mock 데이터 생성 (200위까지 채우기)
        product = {
          rank: i + 1,
          title: `네이버 인기상품 ${i + 1}위`,
          price: Math.floor(Math.random() * 500000) + 10000,
          image: `https://picsum.photos/300/250?random=${i + 1000}`,
          link: `https://search.shopping.naver.com/catalog/${Math.floor(Math.random() * 1000000)}`,
          mall: `쇼핑몰${(i % 10) + 1}`,
          rating: (4.0 + Math.random() * 1).toFixed(1),
          reviewCount: Math.floor(Math.random() * 5000) + 100,
          category: categories[Math.floor(Math.random() * categories.length)],
          platform: 'naver',
          brand: '브랜드명',
          productId: Math.floor(Math.random() * 1000000)
        };
      }
      
      products.push(product);
    }

    // 카테고리 필터 적용
    let filteredProducts = products;
    if (category) {
      filteredProducts = products.filter(p => p.category === category);
    }

    res.status(200).json({
      success: true,
      total: filteredProducts.length,
      products: filteredProducts,
      platform: 'naver',
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('네이버 쇼핑 API 오류:', error);
    
    // 오류 시 Mock 데이터 반환
    const mockProducts = Array.from({ length: 200 }, (_, i) => ({
      rank: i + 1,
      title: `네이버 인기상품 ${i + 1}`,
      price: Math.floor(Math.random() * 500000) + 10000,
      image: `https://picsum.photos/300/250?random=${i + 2000}`,
      link: `https://search.shopping.naver.com/catalog/${Math.floor(Math.random() * 1000000)}`,
      mall: `네이버쇼핑${(i % 5) + 1}`,
      rating: (4.0 + Math.random() * 1).toFixed(1),
      reviewCount: Math.floor(Math.random() * 5000) + 100,
      category: ['전자제품', '패션의류', '생활용품', '식품', '화장품'][i % 5],
      platform: 'naver',
      brand: '브랜드명',
      productId: Math.floor(Math.random() * 1000000)
    }));

    res.status(200).json({
      success: false,
      error: 'API 연동 중 오류 발생',
      products: mockProducts,
      platform: 'naver',
      lastUpdate: new Date().toISOString()
    });
  }
}
