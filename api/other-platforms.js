export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { category = '패션의류', platform = 'gmarket', sortType = 'popularity', start = 1, display = 100 } = req.query;
        
        const platformInfo = {
            'gmarket': { name: '지마켓', color: '#00A0FF', baseUrl: 'https://www.gmarket.co.kr' },
            'auction': { name: '옥션', color: '#FF6B35', baseUrl: 'https://www.auction.co.kr' },
            'interpark': { name: '인터파크', color: '#E31E24', baseUrl: 'https://www.interpark.com' },
            '11st': { name: '11번가', color: '#FF0558', baseUrl: 'https://www.11st.co.kr' },
            'lotte': { name: '롯데온', color: '#E30B17', baseUrl: 'https://www.lotteon.com' },
            'ssg': { name: 'SSG', color: '#FF5722', baseUrl: 'https://www.ssg.com' }
        };

        const currentPlatform = platformInfo[platform] || platformInfo['gmarket'];
        
        // 카테고리별 실제 상품명 Templates
        const productData = {
            '패션의류': [
                { name: '여성 겨울 롱패딩', brands: ['노스페이스', '파타고니아', '컬럼비아'] },
                { name: '남성 캐시미어 코트', brands: ['버버리', '막스마라', '캘빈클라인'] },
                { name: '청바지 스키니핏', brands: ['리바이스', '리', '디젤'] },
                { name: '니트 터틀넥', brands: ['유니클로', '자라', '무지'] }
            ],
            '화장품/뷰티': [
                { name: 'BB크림 SPF30', brands: ['미샤', '에뛰드하우스', '아이오페'] },
                { name: '립틴트 벨벳', brands: ['페리페라', '롬앤', '3CE'] },
                { name: '아이크림 주름개선', brands: ['헤라', '설화수', 'SK2'] },
                { name: '클렌징오일 메이크업', brands: ['바닐라코', '반디', '이니스프리'] }
            ],
            '디지털/가전': [
                { name: '무선충전기 고속', brands: ['삼성', '애플', '벨킨'] },
                { name: 'USB-C 허브', brands: ['유그린', '바사우스', 'HP'] },
                { name: '블루투스 헤드폰', brands: ['소니', '보스', 'JBL'] },
                { name: '스마트워치 방수', brands: ['애플', '삼성', '가민'] }
            ]
        };

        const categoryProducts = productData[category] || productData['패션의류'];
        
        // Mock 데이터 생성
        const items = Array.from({ length: Math.min(display, 100) }, (_, index) => {
            const rank = parseInt(start) + index;
            const product = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
            const brand = product.brands[Math.floor(Math.random() * product.brands.length)];
            
            const originalPrice = Math.floor(Math.random() * 150000 + 30000);
            const discountRate = Math.floor(Math.random() * 60) + 15;
            const finalPrice = Math.floor(originalPrice * (100 - discountRate) / 100);
            
            return {
                rank: rank,
                productName: `${brand} ${product.name} ${Math.floor(Math.random() * 100) + 1}`,
                category: category,
                brand: brand,
                price: finalPrice.toLocaleString() + '원',
                originalPrice: originalPrice.toLocaleString() + '원',
                discountRate: discountRate,
                productUrl: `${currentPlatform.baseUrl}/item/${Math.floor(Math.random() * 9000000) + 1000000}`,
                imageUrl: `https://via.placeholder.com/300x300/${currentPlatform.color.substring(1)}/white?text=${encodeURIComponent(product.name)}`,
                mallName: currentPlatform.name,
                maker: brand,
                rating: (3.8 + Math.random() * 1.2).toFixed(1),
                reviewCount: Math.floor(Math.random() * 3000) + 50,
                platform: platform
            };
        });

        // 정렬
        if (sortType === 'popularity') {
            items.sort((a, b) => (b.reviewCount * parseFloat(b.rating)) - (a.reviewCount * parseFloat(a.rating)));
        } else {
            items.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        }

        items.forEach((item, index) => {
            item.rank = parseInt(start) + index;
        });

        return res.status(200).json({
            success: true,
            platform: platform,
            platformName: currentPlatform.name,
            category: category,
            sortType: sortType,
            sortName: sortType === 'popularity' ? '실시간 인기순' : '추천순',
            total: 8000,
            count: items.length,
            items: items,
            timestamp: new Date().toISOString(),
            note: `${currentPlatform.name}은 현재 Mock 데이터로 제공됩니다.`
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
