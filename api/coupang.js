export default async function handler(req, res) {
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
        const { category = '패션의류', sortType = 'popularity', start = 1, display = 100 } = req.query;
        
        // 카테고리별 실제 상품명 생성
        const productTemplates = {
            '패션의류': [
                '여성 니트 카디건', '남성 후드 티셔츠', '청바지 데님 팬츠', '겨울 패딩 점퍼',
                '원피스 미니 드레스', '정장 블라우스', '운동화 스니커즈', '가죽 핸드백',
                '벨트 액세서리', '스카프 머플러', '모자 비니', '장갑 겨울용품'
            ],
            '화장품/뷰티': [
                '수분 크림 50ml', '클렌징 폼 150ml', '선크림 SPF50+', '립스틱 매트',
                '아이섀도 팔레트', '마스카라 볼륨', '파운데이션 쿠션', '토너 화장수',
                '세럼 비타민C', '마스크팩 10매', '샴푸 탈모방지', '바디로션 보습'
            ],
            '디지털/가전': [
                '아이폰 케이스', '무선 이어폰', '노트북 거치대', '스마트워치 밴드',
                '충전기 고속', '보조배터리 대용량', '블루투스 스피커', '키보드 기계식',
                '마우스 게이밍', '모니터 4K', '웹캠 HD', '태블릿 보호필름'
            ],
            '생활용품': [
                '세탁세제 액체형', '화장지 30롤', '주방세제 천연', '샤워타월 4매',
                '치약 불소', '비누 천연', '수건 마이크로파이버', '걸레 극세사',
                '휴지통 분리수거', '옷걸이 10개', '정리함 수납', '방향제 탈취'
            ],
            '식품/건강식품': [
                '비타민D 1000IU', '오메가3 캡슐', '유산균 프로바이오', '단백질 파우더',
                '견과류 믹스', '올리브오일 엑스트라', '꿀 아카시아', '녹차 티백',
                '현미 10kg', '참기름 500ml', '김 도시락용', '라면 멀티팩'
            ],
            '도서/음반': [
                '베스트셀러 소설', '자기계발서', '요리책 레시피', '어린이 동화책',
                '만화책 완결', '수험서 공무원', '영어 교재', '컬러링북 성인용',
                'CD 클래식', 'DVD 영화', '잡지 월간', '다이어리 2024'
            ],
            '스포츠/레저': [
                '요가매트 NBR', '덤벨 세트', '런닝화 경량', '수영복 원피스',
                '등산화 방수', '자전거 헬멧', '골프공 12개', '배드민턴 라켓',
                '축구공 공식', '농구공 실내용', '테니스 라켓', '스케이트보드'
            ]
        };

        const templates = productTemplates[category] || productTemplates['패션의류'];
        const brands = ['삼성', 'LG', '나이키', '아디다스', '유니클로', '자라', '무지', '올리브영', '이니스프리', '더페이스샵'];
        
        // Mock 데이터 생성 (실제 상품명과 유사하게)
        const items = Array.from({ length: Math.min(display, 100) }, (_, index) => {
            const rank = parseInt(start) + index;
            const template = templates[Math.floor(Math.random() * templates.length)];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            
            const originalPrice = Math.floor(Math.random() * 100000 + 20000);
            const discountRate = Math.floor(Math.random() * 50) + 10;
            const finalPrice = Math.floor(originalPrice * (100 - discountRate) / 100);
            
            return {
                rank: rank,
                productName: `${brand} ${template}`,
                category: category,
                brand: brand,
                price: finalPrice.toLocaleString() + '원',
                originalPrice: originalPrice.toLocaleString() + '원',
                discountRate: discountRate,
                productUrl: `https://www.coupang.com/vp/products/${Math.floor(Math.random() * 9000000) + 1000000}`,
                imageUrl: `https://via.placeholder.com/300x300/ff6600/white?text=${encodeURIComponent(template)}`,
                mallName: '쿠팡',
                maker: brand,
                rating: (4.0 + Math.random() * 1.0).toFixed(1),
                reviewCount: Math.floor(Math.random() * 5000) + 100,
                platform: 'coupang'
            };
        });

        // 정렬 처리
        if (sortType === 'popularity') {
            // 실시간 인기순 (리뷰수 + 평점 조합)
            items.sort((a, b) => (b.reviewCount * parseFloat(b.rating)) - (a.reviewCount * parseFloat(a.rating)));
        } else if (sortType === 'recommend') {
            // 추천순 (평점 위주)
            items.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        }

        // 순위 재정렬
        items.forEach((item, index) => {
            item.rank = parseInt(start) + index;
        });

        return res.status(200).json({
            success: true,
            platform: 'coupang',
            platformName: '쿠팡',
            category: category,
            sortType: sortType,
            sortName: sortType === 'popularity' ? '실시간 인기순' : '추천순',
            total: 10000,
            count: items.length,
            items: items,
            timestamp: new Date().toISOString(),
            note: '⚠️ 쿠팡은 현재 Mock 데이터로 제공됩니다. 실제 API 연동 시 실시간 데이터로 교체됩니다.'
        });

    } catch (error) {
        console.error('쿠팡 API 오류:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
