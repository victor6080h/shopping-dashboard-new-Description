export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});

  const { product='', rank=0, platform='naver' } = req.body||{};
  if(!product) return res.status(400).json({ error:'상품명이 필요합니다' });

  try{
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if(OPENAI_API_KEY){
      // 필요 시 OpenAI 연동 (선택)
      // 간단히 기본 분석을 반환하고, 추후 확장
    }
    // 기본 분석
    const A = gen(product, rank, platform);
    return res.status(200).json({ success:true, product, rank, platform, analysis:A, generatedAt:new Date().toISOString() });
  }catch(e){
    return res.status(500).json({ success:false, error:e.message });
  }
}

function gen(product, rank, platform){
  const top = rank && rank<=50;
  return {
    marketPositioning:{
      '주 타깃 고객': top?'20-40대 남녀, 수도권':'30-50대 남녀, 전국',
      '가격대·경쟁 구간': top?'중상~프리미엄 구간':'중가~가성비 구간',
      '경쟁사 제품 비교': top?'상위권 치열, 리뷰/인지도 강점':'인지도/노출 보완 필요',
      '포지셔닝 제안': top?'브랜드 강화+프리미엄 라인':'가성비/차별화 포인트 강화'
    },
    performance:{
      '강점': ['품질 평판','배송/CS 안정성','리뷰 축적'],
      '약점': ['일부 가격 민감도','옵션 다양성 개선'],
      '핵심 전략': top? '프리미엄 경험/로열티 강화':'인지도/리뷰 증대 캠페인',
      '핵심 지표': {만족도: top?'높음':'보통', 재구매: top?'높음':'중간'}
    },
    seasonalTrends:{
      '성수기': '11~12월, 3~5월',
      '비수기': '1~2월, 7~8월',
      '마케팅 시기': '성수기 2개월 전부터 예열',
      '연간 트렌드': top?'완만한 상승세':'계절성 변동'
    },
    improvements:{
      '제품 개선': ['내구성/편의성 보강','옵션 확대'],
      '패키징/브랜딩': ['친환경 소재','언박싱 경험'],
      '디지털 마케팅': platform==='naver'?'네이버 DA/쇼핑검색 최적화':'로켓와우/쿠팡광고 집행',
      '혁신 포인트': ['구독/번들','A/S/케어']
    },
    benchmarking:{
      '해외 사례': ['아마존 유사 품목 베스트 사례 분석'],
      '인플루언서': ['유튜브 리뷰·숏폼 협업'],
      '확장 전략': ['프리미엄/에센셜 라인 이원화','크로스셀링 번들']
    },
    finalOpinion:{
      '시장 진입성': top?'매우 높음':'보통 이상',
      '수익성': top?'긍정적(ROI↑)':'개선 여지',
      '리스크': ['경쟁 신제품','플랫폼 정책변경'],
      '권장사항': top?'3개월 내 신제품/리뉴얼':'6개월 내 인지도/리뷰 증대'
    },
    sellerInfo: platform==='coupang' ? 
      { 판매자:'쿠팡/파트너', 평판:'우수', 문의:'고객센터' } :
      { 판매자:'네이버 스토어/파트너', 평판:'우수', 문의:'고객센터' }
  };
}
