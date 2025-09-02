export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
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
                error: '네이버 API 키가 설정되지 않았습니다'
            });
        }

        const { category = '패션', start = 1, display = 20 } = req.query;
        
        // URL 파라미터 구성
        const params = new URLSearchParams({
            query: category,
            start: parseInt(start),
            display: Math.min(parseInt(display), 100),
            sort: 'sim'
        });

        // 네이버 API 호출 (헤더 최적화)
        const apiUrl = `https://openapi.naver.com/v1/search/shop.json?${params}`;
        
        console.log('네이버 API 호출:', {
            url: apiUrl,
            clientId: clientId.substring(0, 8) + '...',
            timestamp: new Date().toISOString()
        });

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
                'User-Agent': 'Mozilla/5.0 (compatible; ShoppingDashboard/1.0; +https://shopping-dashboard-new.vercel.app)',
                'Accept': 'application/json',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
            },
            timeout: 10000
        });

        console.log('네이버 API 응답:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        // 응답 처리
        if (!response.ok) {
            const errorText = await response.text();
            console.error('네이버 API 오류 상세:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
                url: apiUrl
            });

            // 401 오류인 경우 특별 처리
            if (response.status === 401) {
                return res.status(401).json({
                    success: false,
                    error: '네이버 API 인증 실패',
                    details: '개발자 센터에서 서비스 URL 설정을 확인해주세요',
                    troubleshoot: {
                        step1: '네이버 개발자센터 > 내 애플리케이션 접속',
                        step2: '서비스 URL에 https://shopping-dashboard-new.vercel.app 추가',
                        step3: '쇼핑 API 사용 설정 확인'
                    },
                    apiResponse: errorText
                });
            }

            return res.status(response.status).json({
                success: false,
                error: `네이버 API 오류: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('네이버 API 성공:', {
            total: data.total,
            itemCount: data.items?.length || 0
        });
        
        // 데이터 정제
        const items = (data.items || []).map((item, index) => ({
            rank: parseInt(start) + index,
            title: item.title?.replace(/<[^>]*>/g, '').trim() || '제목 없음',
            price: item.lprice && parseInt(item.lprice) > 0 ? 
                   `${parseInt(item.lprice).toLocaleString()}원` : 
                   (item.hprice && parseInt(item.hprice) > 0 ? 
                    `${parseInt(item.hprice).toLocaleString()}원` : '가격 정보 없음'),
            link: item.link || '',
            image: item.image || '',
            mallName: item.mallName || '네이버쇼핑',
            brand: item.brand || '',
            category: category,
            maker: item.maker || ''
        }));

        return res.status(200).json({
            success: true,
            platform: 'naver',
            category: category,
            total: data.total || 0,
            count: items.length,
            items: items,
            timestamp: new Date().toISOString(),
            debug: {
                apiCalled: true,
                responseStatus: response.status
            }
        });

    } catch (error) {
        console.error('네이버 API 전체 오류:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            type: error.name,
            timestamp: new Date().toISOString()
        });
    }
}
