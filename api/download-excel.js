export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { category = '전체', type = 'sales' } = req.query;
        
        // CSV 형태로 데이터 생성 (엑셀 호환)
        const headers = [
            '순위', '상품명', '카테고리', '브랜드', '가격', '정가', '할인율(%)', 
            '평점', '리뷰수', '판매량', '판매자명', '판매자평점', '사업자번호', 
            '판매자주소', '연락처', '플랫폼', '주요특징', '감정분석(긍정%)'
        ];
        
        // 샘플 데이터 150개 생성
        const csvData = [headers.join(',')];
        
        for (let i = 1; i <= 150; i++) {
            const row = [
                i,
                `상품명 ${i}`,
                category,
                `브랜드${i}`,
                `${(Math.random() * 100000 + 10000).toFixed(0)}원`,
                `${(Math.random() * 120000 + 15000).toFixed(0)}원`,
                Math.floor(Math.random() * 50) + 10,
                (4.0 + Math.random() * 1.0).toFixed(1),
                Math.floor(Math.random() * 5000) + 100,
                Math.floor(Math.random() * 10000) + 500,
                `판매자${Math.floor(Math.random() * 100) + 1}`,
                (4.2 + Math.random() * 0.8).toFixed(1),
                `123-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90000) + 10000}`,
                '서울특별시',
                '02-1234-5678',
                '네이버쇼핑',
                '무료배송/당일발송',
                Math.floor(Math.random() * 30) + 60
            ];
            csvData.push(row.join(','));
        }
        
        const csvContent = csvData.join('\n');
        const filename = `쇼핑순위_${category}_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        
        // UTF-8 BOM 추가 (한글 깨짐 방지)
        res.write('\ufeff');
        res.write(csvContent);
        res.end();

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
