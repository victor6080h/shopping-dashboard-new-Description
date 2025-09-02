export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 환경변수 확인
        const clientId = process.env.NAVER_CLIENT_ID;
        const clientSecret = process.env.NAVER_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
            return res.status(500).json({
                success: false,
                error: '네이버 API 키가 설정되지 않았습니다',
                debug: { hasClientId: !!clientId, hasClientSecret: !!clientSecret }
            });
        }

        const { category = '패션의류', sortType = 'sim', start = 1, display = 100 } = req.query;
        
        // 카테고리별 검색 키워드 매핑
        const categoryKeywords = {
            '패션의류': '패션 의류',
            '화장품/뷰티': '화장품',
            '디지털/가전': '스마트폰',
            '생활용품': '생활용품',
            '식품/건강식품': '건강식품',
            '도서/음반': '도서',
            '스포츠/레저': '운동용품',
            '자동차용품': '자동차',
            '유아/아동': '유아용품',
            '반려동물': '펫샵',
            '홈인테리어': '인테리어',
            '문구/오피스': '문구'
        };

        const searchKeyword = categoryKeywords[category] || category;
        
        // 정렬 방식 설정 (실시간 인기순 vs 추천순)
        const sortMap = {
            'popularity': 'sim',    // 실시간 인기순 (정확도순)
            'recommend': 'date',    // 추천순 (최신순) 
            'price_asc': 'asc',     // 가격 낮은순
            'price_desc': 'dsc'     // 가격 높은순
        };
        
        const naverSort = sortMap[sortType] || 'sim';

        // 네이버 쇼핑 API 호출
        const params = new URLSearchParams({
            query: searchKeyword,
            start: parseInt(start),
            display: Math.min(parseInt(display), 100),
            sort: naverSort
        });

        const apiUrl = `https://openapi.naver.com/v1/search/shop.json?${params}`;
        
        console.log('네이버 API 호출:', {
            keyword: searchKeyword,
            category: category,
            sort: naverSort,
            url: apiUrl
        });

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
                'User-Agent': 'Mozilla/5.0 (compatible; PLAYG-Shopping/1.0)',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('네이버 API 오류:', response.status, errorText);
            
            return res.status(response.status).json({
                success: false,
                error: `네이버 API 오류: ${response.status}`,
                details: errorText,
                troubleshoot: response.status === 401 ? 
                    '네이버 개발자센터에서 서비스 URL 설정을 확인해주세요' : 
                    '네이버 API 호출 중 오류가 발생했습니다'
            });
        }

        const data = await response.json();
        console.log('네이버 API 성공:', {
            total: data.total,
            itemCount: data.items?.length || 0
        });
        
        // 데이터 정제 및 순위 부여
        const items = (data.items || []).map((item, index) => {
            // 가격 정보 정확하게 처리
            let finalPrice = '';
            let originalPrice = '';
            let discountRate = 0;
            
            if (item.lprice && parseInt(item.lprice) > 0) {
                finalPrice = parseInt(item.lprice);
                if (item.hprice && parseInt(item.hprice) > finalPrice) {
                    originalPrice = parseInt(item.hprice);
                    discountRate = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
                }
            } else if (item.hprice && parseInt(item.hprice) > 0) {
                finalPrice = parseInt(item.hprice);
            }

            // 상품명 정확하게 정제
            const cleanTitle = item.title
                ?.replace(/<[^>]*>/g, '')      // HTML 태그 제거
                ?.replace(/&lt;/g, '<')        // HTML 엔티티 복원
                ?.replace(/&gt;/g, '>')
                ?.replace(/&amp;/g, '&')
                ?.replace(/&quot;/g, '"')
                ?.replace(/&#39;/g, "'")
                ?.trim() || '상품명 없음';

            return {
                rank: parseInt(start) + index,
                productName: cleanTitle,
                category: category,
                brand: item.brand?.trim() || '',
                price: finalPrice ? finalPrice.toLocaleString() + '원' : '가격 문의',
                originalPrice: originalPrice ? originalPrice.toLocaleString() + '원' : '',
                discountRate: discountRate,
                productUrl: item.link || '',  // 실제 구매 링크
                imageUrl: item.image || '',
                mallName: item.mallName?.trim() || '네이버쇼핑',
                maker: item.maker?.trim() || '',
                productId: item.productId || '',
                categoryId: item.category1 || '',
                platform: 'naver'
            };
        });

        return res.status(200).json({
            success: true,
            platform: 'naver',
            platformName: '네이버쇼핑',
            category: category,
            sortType: sortType,
            sortName: sortType === 'popularity' ? '실시간 인기순' : '추천순',
            total: data.total || 0,
            count: items.length,
            items: items,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('네이버 API 전체 오류:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
