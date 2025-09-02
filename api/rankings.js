export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { category = '전체', platform = 'all', type = 'sales' } = req.query;
        
        // 1-150위 랭킹 데이터 생성
        const rankings = Array.from({ length: 150 }, (_, index) => {
            const rank = index + 1;
            const categories = ['패션', '화장품', '디지털', '가전', '생활용품', '식품', '도서', '스포츠'];
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            
            return {
                rank: rank,
                productName: `${randomCategory} 인기상품 ${rank}`,
                category: randomCategory,
                brand: `브랜드${Math.floor(Math.random() * 50) + 1}`,
                price: Math.floor(Math.random() * 200000 + 10000),
                originalPrice: Math.floor(Math.random() * 250000 + 15000),
                discountRate: Math.floor(Math.random() * 50) + 10,
                rating: (4.0 + Math.random() * 1.0).toFixed(1),
                reviewCount: Math.floor(Math.random() * 5000) + 100,
                salesVolume: Math.floor(Math.random() * 10000) + 500,
                seller: {
                    name: `판매자${Math.floor(Math.random() * 100) + 1}`,
                    rating: (4.2 + Math.random() * 0.8).toFixed(1),
                    businessNumber: `123-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90000) + 10000}`,
                    address: ['서울', '부산', '대구', '인천', '광주'][Math.floor(Math.random() * 5)] + ' 소재',
                    phone: `02-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`
                },
                platform: ['네이버', '쿠팡', '지마켓', '옥션'][Math.floor(Math.random() * 4)],
                keyFeatures: [
                    '무료배송', '당일발송', '품질보증', 'A/S 1년', '환불보장'
                ].slice(0, Math.floor(Math.random() * 3) + 2),
                monthlyTrend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100) + 50),
                competitorPrice: {
                    lowest: Math.floor(Math.random() * 150000 + 8000),
                    highest: Math.floor(Math.random() * 300000 + 20000),
                    average: Math.floor(Math.random() * 200000 + 15000)
                },
                sentiment: {
                    positive: Math.floor(Math.random() * 30) + 60,
                    neutral: Math.floor(Math.random() * 20) + 10,
                    negative: Math.floor(Math.random() * 20) + 5
                }
            };
        });

        return res.status(200).json({
            success: true,
            type: type === 'sales' ? '판매순위' : '추천순위',
            category: category,
            platform: platform,
            totalCount: 150,
            rankings: rankings,
            lastUpdated: new Date().toISOString(),
            categories: [
                '전체', '패션의류', '화장품/뷰티', '디지털/가전', '생활용품', 
                '식품/건강식품', '도서/음반', '스포츠/레저', '자동차용품', 
                '유아/아동', '반려동물', '홈인테리어', '문구/오피스'
            ]
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
