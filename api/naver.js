export default async function handler(req, res) {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
                debug: {
                    hasClientId: !!clientId,
                    hasClientSecret: !!clientSecret
                }
            });
        }

        // 요청 파라미터
        const { category = '패션', start = 1, display = 20 } = req.query;
        
        // 네이버 API 호출
        const apiUrl = new URL('https://openapi.naver.com/v1/search/shop.json');
        apiUrl.searchParams.set('query', category);
        apiUrl.searchParams.set('start', start);
        apiUrl.searchParams.set('display', Math.min(display, 100));
        apiUrl.searchParams.set('sort', 'sim');

        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
                'User-Agent': 'Shopping-Dashboard/1.0'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                success: false,
                error: `네이버 API 오류: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        
        // 데이터 정제
        const items = (data.items || []).map((item, index) => ({
            rank: parseInt(start) + index,
            title: item.title?.replace(/<[^>]*>/g, '') || '제목 없음',
            price: item.lprice ? `${parseInt(item.lprice).toLocaleString()}원` : '가격 정보 없음',
            link: item.link || '',
            image: item.image || '',
            mallName: item.mallName || '정보 없음',
            brand: item.brand || '',
            category: category
        }));

        return res.status(200).json({
            success: true,
            platform: 'naver',
            category: category,
            total: data.total || 0,
            count: items.length,
            items: items,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('네이버 API 오류:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
