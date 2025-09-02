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
    console.log('환경변수 확인:', {
      clientId: process.env.NAVER_CLIENT_ID ? '설정됨' : '❌ 없음',
      clientSecret: process.env.NAVER_CLIENT_SECRET ? '설정됨' : '❌ 없음'
    });

    // API 키 검증
    if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
      console.error('❌ 네이버 API 키가 설정되지 않음');
      return res.status(200).json({
        success: false,
        error: 'API 키가 설정되지 않았습니다. Vercel 환경변수를 확인하세요.',
        isTestData: true,
        products: generateTestProducts()
      });
    }

    // 실제 네이버 API 호출
    const categories = ['노트북', '스마트폰', '이어폰', '청소기', '운동화', '화장품', '식품', '의류'];
    const allProducts = [];

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      
      try {
        console.log(`📞 ${category} 카테고리 API 호출 중...`);
        
        const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
          headers: {
            'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
          },
          params: {
            query: category,
            display: 25,
            start: 1,
            sort: 'sim'
          },
          timeout: 15000
        });

        console.log(`✅ ${category}: ${response.data.items.length}개 상품 수신`);

        const products = response.data.items.map((item, index) => ({
          rank: allProducts.length + index + 1,
          id: item.productId || `naver_${category}_${index}`,
          name: item.title.replace(/<[^>]*>/g, ''),
          price: item.lprice ? `${parseInt(item.lprice).toLocaleString()}원` : '가격 확인',
          originalPrice: item.hprice ? `${parseInt(item.hprice).toLocaleString()}원` : null,
          image: item.image,
          link: item.link,
          mallName: item.mallName,
          maker: item.maker,
          brand: item.brand,
          category: category,
          platform: 'naver',
          isRealData: true
        }));

        allProducts.push(...products);
        
        // API 호출 간격 (레이트 리밋 방지)
        if (i < categories.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
      } catch (categoryError) {
        console.error(`❌ ${category} 카테고리 오류:`, categoryError.message);
        
        // 카테고리별 오류 시에도 일부 테스트 데이터 추가
        const fallbackProducts = generateCategoryFallback(category, allProducts.length);
        allProducts.push(...fallbackProducts);
      }
    }

    const finalProducts = allProducts.slice(0, 200);
    
    console.log(`🎉 네이버 API 호출 완료: 총 ${finalProducts.length}개 상품`);
    console.log(`📊 실제 데이터: ${finalProducts.filter(p => p.isRealData).length}개`);

    res.status(200).json({
      success: true,
      products: finalProducts,
      totalCount: finalProducts.length,
      realDataCount: finalProducts.filter(p => p.isRealData).length,
      apiStatus: 'success',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 네이버 API 전체 오류:', error.message);
    
    res.status(200).json({
      success: false,
      error: error.message,
      isTestData: true,
      products: generateTestProducts(),
      apiStatus: 'error'
    });
  }
}

// 테스트 데이터 생성 함수
function generateTestProducts() {
  const testProducts = [
    { name: "삼성 갤럭시 버즈3 프로 [테스트]", price: "189,000원", link: "https://shopping.naver.com/catalog/34567890" },
    { name: "아이폰 15 프로 케이스 [테스트]", price: "29,900원", link: "https://shopping.naver.com/catalog/45678901" },
    { name: "다이슨 V15 무선청소기 [테스트]", price: "699,000원", link: "https://shopping.naver.com/catalog/56789012" },
    { name: "나이키 에어포스1 [테스트]", price: "119,000원", link: "https://shopping.naver.com/catalog/67890123" },
    { name: "LG 그램 17인치 노트북 [테스트]", price: "1,299,000원", link: "https://shopping.naver.com/catalog/78901234" }
  ];

  return testProducts.map((product, index) => ({
    rank: index + 1,
    id: `test_${index + 1}`,
    name: product.name,
    price: product.price,
    image: `https://via.placeholder.com/200x180?text=${encodeURIComponent(product.name)}`,
    link: product.link,
    mallName: "테스트 쇼핑몰",
    platform: 'naver',
    isRealData: false,
    category: '테스트'
  }));
}

function generateCategoryFallback(category, startRank) {
  return [{
    rank: startRank + 1,
    id: `fallback_${category}`,
    name: `${category} 베스트 상품 [API 오류로 대체 데이터]`,
    price: "가격 확인 필요",
    image: `https://via.placeholder.com/200x180?text=${encodeURIComponent(category)}`,
    link: `https://shopping.naver.com/search/all?query=${encodeURIComponent(category)}`,
    mallName: "네이버쇼핑",
    platform: 'naver',
    isRealData: false,
    category: category
  }];
}
