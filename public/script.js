class PlayGDashboard {
    constructor() {
        this.currentPlatform = 'naver';
        this.currentProducts = [];
        this.isLoading = false;
        
        this.init();
    }

    init() {
        console.log('🚀 PLAY.G 대시보드 초기화');
        this.loadData();
    }

    async loadData() {
        if (this.isLoading) return;
        
        this.showLoading(true);
        this.updateStatus('실시간 데이터 불러오는 중...');

        try {
            const response = await fetch(`/api/${this.currentPlatform}`);
            const data = await response.json();

            if (data.success) {
                this.currentProducts = data.products;
                this.renderProducts();
                this.updateStatus(`${data.products.length}개 상품 로드 완료 (${new Date().toLocaleTimeString()})`);
                console.log(`✅ ${this.currentPlatform} 데이터 로드 성공:`, data.products.length, '개');
            } else {
                throw new Error(data.message || 'API 응답 오류');
            }
        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);
            this.updateStatus(`오류: ${error.message}`);
            this.showErrorMessage(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        
        if (!this.currentProducts || this.currentProducts.length === 0) {
            grid.innerHTML = '<div class="no-data">상품 데이터가 없습니다.</div>';
            return;
        }

        grid.innerHTML = this.currentProducts.map((product, index) => `
            <div class="product-card" data-rank="${product.rank}">
                <div class="product-rank ${this.getRankClass(product.rank)}">${product.rank}위</div>
                
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/200x180?text=이미지+없음'">
                
                <div class="product-name" title="${product.name}">
                    ${product.name}
                </div>
                
                <div class="product-price">${product.price}</div>
                
                <div class="product-info">
                    <span class="platform-badge ${this.currentPlatform}">
                        ${this.currentPlatform === 'naver' ? '네이버' : '쿠팡'}
                    </span>
                    ${product.mallName ? `<span>${product.mallName}</span>` : ''}
                    ${product.isRocket ? '<span>🚀</span>' : ''}
                </div>
                
                <button class="buy-button" onclick="dashboard.buyProduct('${product.link}', '${product.name}', ${product.rank})">
                    🛒 구매하기
                </button>
            </div>
        `).join('');

        console.log(`📊 ${this.currentProducts.length}개 상품 렌더링 완료`);
    }

    getRankClass(rank) {
        if (rank <= 10) return 'top-10';
        if (rank <= 50) return 'top-50';
        return '';
    }

    buyProduct(link, name, rank) {
        console.log(`🛒 구매 클릭: ${rank}위 - ${name}`);
        console.log(`🔗 링크: ${link}`);
        
        if (!link || link === 'undefined' || link === '#') {
            alert('상품 링크를 찾을 수 없습니다.');
            return;
        }

        // 실제 쇼핑몰 사이트로 이동
        const newWindow = window.open(link, '_blank', 'noopener,noreferrer');
        
        if (!newWindow) {
            // 팝업 차단된 경우
            if (confirm('팝업이 차단되었습니다. 현재 창에서 열까요?')) {
                window.location.href = link;
            }
        }

        // 클릭 통계 (선택사항)
        this.trackClick(rank, name, this.currentPlatform);
    }

    trackClick(rank, name, platform) {
        // 클릭 통계 기록 (Google Analytics, 자체 분석 등)
        console.log(`📈 클릭 추적: ${platform} ${rank}위 ${name}`);
    }

    showLoading(show) {
        this.isLoading = show;
        const loading = document.getElementById('loading');
        loading.style.display = show ? 'block' : 'none';
    }

    updateStatus(message) {
        const status = document.getElementById('status');
        status.textContent = message;
    }

    showErrorMessage(error) {
        const grid = document.getElementById('products-grid');
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px; background: white; border-radius: 15px;">
                <h3 style="color: #e74c3c; margin-bottom: 20px;">⚠️ 데이터 로드 실패</h3>
                <p style="margin-bottom: 20px; color: #666;">${error}</p>
                <button onclick="dashboard.loadData()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🔄 다시 시도
                </button>
            </div>
        `;
    }

    // 엑셀 다운로드
    downloadExcel() {
        if (!this.currentProducts || this.currentProducts.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `PLAYG_${this.currentPlatform}_베스트_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    generateCSV() {
        const headers = ['순위', '상품명', '가격', '쇼핑몰', '플랫폼', '링크'];
        const rows = this.currentProducts.map(product => [
            product.rank,
            `"${product.name.replace(/"/g, '""')}"`,
            product.price,
            product.mallName || '',
            this.currentPlatform === 'naver' ? '네이버' : '쿠팡',
            product.link
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

// 전역 함수들
function switchPlatform(platform) {
    if (dashboard.isLoading) return;
    
    // 탭 활성화
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    dashboard.currentPlatform = platform;
    console.log(`🔄 플랫폼 변경: ${platform}`);
    dashboard.loadData();
}

function refreshData() {
    console.log('🔄 데이터 새로고침');
    dashboard.loadData();
}

function downloadExcel() {
    dashboard.downloadExcel();
}

// 대시보드 인스턴스 생성
const dashboard = new PlayGDashboard();
