import { createHmac } from 'crypto';

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
        const accessKey = process.env.COUPANG_ACCESS_KEY;
        const secretKey = process.env.COUPANG_SECRET_KEY;
        const vendorId = process.env.COUPANG_VENDOR_ID;
        
        if (!accessKey || !secretKey || !vendorId) {
            return res.status(500).json({
                success: false,
                error: '쿠팡 API 키가 설정되지 않았습니다',
                debug: {
                    hasAccessKey: !!accessKey,
                    hasSecretKey: !!secretKey,
                    hasVendorId: !!vendorId
                }
            });
        }

        // 요청 파라미터
        const { category = '패션', limit = 20 } = req.query;
        
        // HMAC 서명 생성
        const method = 'GET';
        const path = '/v2/providers/affiliate_open_api/apis/openapi/products/search';
        const timestamp = Date.now().toString();
        
        const message = timestamp + method + path;
        const signature = createHmac('sha256', secretKey)
            .update(message)
            .digest('hex');

        // API 호출
        const apiUrl = new URL(`https://api-gateway.coupang.com${path}`);
        apiUrl.searchParams.set('keyword', category);
        apiUrl.searchParams.set('limit', Math.min(limit, 100));

        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${timestamp}, signature=${signature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                success: false,
                error: `쿠팡 API 오류: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        const products = data.data?.productData || [];
        
        // 데이터 정제
        const items = products.map((item, index) => ({
            rank: index + 1,
            title: item.productName || '제품명 없음',
            price: item.productPrice ? `${parseInt(item.productPrice).toLocaleString()}원` : '가격 정보 없음',
            link: item.productUrl || '',
            image: item.productImage || '',
            mallName: '쿠팡',
            brand: item.vendorName || '',
            category: category
        }));

        return res.status(200).json({
            success: true,
            platform: 'coupang',
            category: category,
            total: items.length,
            count: items.length,
            items: items,
            timestamp: new Date().toISOString()
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
