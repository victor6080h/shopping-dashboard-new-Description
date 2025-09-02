import axios from 'axios';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🔍 네이버 API 호출 시작');

    // API 키 확인
    if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
      console.log('⚠️ 네이버 API 키가 설정되지 않음 - 테스트 데이터 사용');
      
      // 테스트 데이터
      const testProducts = generateTestProducts('naver');
      
      return res.status(200).json({
        success: true,
        products: testProducts,
        totalCount: testProducts.length,
        message: 'API 키 미설정 - 테스트 데이터 사용 중'
      });
    }

    // 실제 네이버 API 호출
    const categories = ['노트북', '스마트폰', '이어폰', '청소기', '운동화'];
    const allProducts = [];

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      
      try {
        const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
          headers: {
            'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
          },
          params: {
            query: category,
            display: 40,
            start: 1,
            sort: 'sim'
          },
          timeout: 10000
        });

        const products = response.data.items.slice(0, 40).map((item, index) => ({
          rank: allProducts.length + index + 1,
          id: item.productId || `naver_${category}_${index}`,
          name: item.title.replace(/<[^>]*>/g, ''),
          price: item.lprice ? `${parseInt(item.lprice).toLocaleString()}원` : '가격 확인',
          image: item.image,
          link: item.link,
          mallName: item.mallName,
          category: category,
          platform: 'naver'
        }));

        allProducts.push(...products);
        
        // API 호출 간격
        if (i < categories.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (categoryError) {
        console.error(`❌ ${category} 카테고리 오류:`, categoryError.message);
      }
    }

    console.log(`✅ 네이버 상품 ${allProducts.length}개 조회 완료`);

    res.status(200).json({
      success: true,
      products: allProducts.slice(0, 200),
      totalCount: allProducts.length
    });

  } catch (error) {
    console.error('❌ 네이버 API 전체 오류:', error.message);
    
    // 오류 시 테스트 데이터 반환
    const testProducts = generateTestProducts('naver');
    
    res.status(200).json({
      success: true,
      products: testProducts,
      totalCount: testProducts.length,
      message: `API 오류로 테스트 데이터 사용: ${error.message}`
    });
  }
}

// 테스트 데이터 생성 함수
function generateTestProducts(platform) {
  const naverProducts = [
    { name: "삼성 갤럭시 버즈3 프로", price: "189,000원", link: "https://shopping.naver.com/catalog/34567890" },
    { name: "아이폰 15 프로 케이스", price: "29,900원", link: "https://shopping.naver.com/catalog/45678901" },
    { name: "다이슨 V15 무선청소기", price: "699,000원", link: "https://shopping.naver.com/catalog/56789012" },
    { name: "나이키 에어포스1", price: "119,000원", link: "https://shopping.naver.com/catalog/67890123" },
    { name: "LG 그램 17인치 노트북", price: "1,299,000원", link: "https://shopping.naver.com/catalog/78901234" }
  ];

  const products = [];
  for (let i = 0; i < 200; i++) {
    const base = naverProducts[i % naverProducts.length];
    products.push({
      rank: i + 1,
      id: `${platform}_${i + 1}`,
      name: `${base.name} - ${i + 1}위`,
      price: base.price,
      image: `https://via.placeholder.com/200x180?text=${encodeURIComponent(base.name)}`,
      link: base.link,
      mallName: "네이버쇼핑",
      platform: platform
    });
  }
  
  return products;
}
