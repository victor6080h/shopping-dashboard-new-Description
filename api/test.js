export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const envStatus = {
        timestamp: new Date().toISOString(),
        environment: 'Vercel Production',
        variables: {
            NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? '✅ 설정됨' : '❌ 없음',
            NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ? '✅ 설정됨' : '❌ 없음',
            COUPANG_ACCESS_KEY: process.env.COUPANG_ACCESS_KEY ? '✅ 설정됨' : '❌ 없음',
            COUPANG_SECRET_KEY: process.env.COUPANG_SECRET_KEY ? '✅ 설정됨' : '❌ 없음',
            COUPANG_VENDOR_ID: process.env.COUPANG_VENDOR_ID ? '✅ 설정됨' : '❌ 없음'
        },
        preview: {
            NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? process.env.NAVER_CLIENT_ID.substring(0, 6) + '...' : null,
            COUPANG_ACCESS_KEY: process.env.COUPANG_ACCESS_KEY ? process.env.COUPANG_ACCESS_KEY.substring(0, 6) + '...' : null
        },
        node_version: process.version
    };

    return res.status(200).json(envStatus);
}
