async function fetchNaverData(category, sort, query) {
  try {
    showLoading(true);
    
    const params = new URLSearchParams({
      category: category,
      sort: sort,
      display: 50,
      start: 1
    });
    
    if (query) params.append('query', query);
    
    const response = await fetch(`/api/naver?${params.toString()}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '네이버 API 호출 실패');
    }
    
    console.log('네이버 데이터 로드 성공:', data.items.length, '개 상품');
    return data.items;
    
  } catch (error) {
    console.error('네이버 API 오류:', error);
    showError('네이버 쇼핑 데이터를 불러올 수 없습니다: ' + error.message);
    return [];
  } finally {
    showLoading(false);
  }
}

// 오류 표시 함수
function showError(message) {
  const container = document.getElementById('product-grid');
  container.innerHTML = `
    <div class="col-span-full text-center py-8">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        ${message}
      </div>
    </div>
  `;
}

// 로딩 상태 표시
function showLoading(show) {
  const container = document.getElementById('product-grid');
  if (show) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8">
        <i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
        <p class="mt-2 text-gray-600">데이터를 불러오는 중...</p>
      </div>
    `;
  }
}
