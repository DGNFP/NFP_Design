document.addEventListener('DOMContentLoaded', function() {
    // 글로벌 변수 설정
    const postsPerPage = 6; // 페이지당 게시글 수
    let currentPage = 1;
    let allPosts = []; // 모든 게시글을 저장할 배열



// Netlify CMS API 연동
if (window.netlifyIdentity) {
  window.netlifyIdentity.on("init", user => {
    // 사용자가 로그인하면 Netlify CMS 콘텐츠에 접근
    if (user) {
      const posts = window.netlifyIdentity.currentUser().meta.posts;
      if (posts) {
        allPosts = posts;
        displayPosts(allPosts, currentPage);
        setupPagination(allPosts);
      }
    }
  });
}



    // 메뉴 토글 기능 (사용하지 않는다면 삭제)
    const menuBtn = document.querySelector('.menu-btn');
    const menu = document.querySelector('.menu');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            menu.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });
    }

    // 글쓰기 모달 관련
    const writeBtn = document.getElementById('write-btn');
    const writeModal = document.getElementById('write-modal');
    const closeButton = document.querySelector('.close-button');
    
    // 글쓰기 버튼 클릭 시 모달 열기
    if (writeBtn) {
        writeBtn.addEventListener('click', function() {
            writeModal.style.display = 'block'; // 모달 열기
        });
    }
    
    // 닫기 버튼 클릭 시 모달 닫기
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            writeModal.style.display = 'none'; // 모달 닫기
        });
    }
    
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        if (event.target === writeModal) { // 모달 외부 클릭 시
            writeModal.style.display = 'none'; // 모달 닫기
        }
    });

    // 🔽 1차/2차 카테고리 연결 로직
    const categoryMap = {
        '웹 디자인': ['홈페이지', '디지털배너', '상세페이지', 'ux/ui', '기타'],
        '컨텐츠 디자인': ['카드뉴스', '포스터', 'SNS이미지', '피드광고', '기타'],
        '영상 디자인': ['영상 제작', '영상 편집', '모션그래픽', '유튜브 썸네일'],
        '광고/인쇄 디자인': ['현수막/엑스배너', '명함', '브로슈어/카탈로그', '옥외광고']
    };

    const primarySelect = document.getElementById('primary-category');
    const secondarySelect = document.getElementById('secondary-category');

    if (primarySelect && secondarySelect) {
        primarySelect.addEventListener('change', function () {
            const selectedPrimary = this.value;
            const options = categoryMap[selectedPrimary] || [];

            secondarySelect.innerHTML = '<option value="">선택하세요</option>';
            options.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                secondarySelect.appendChild(opt);
            });
        });
    }

    // 🔽 파일 업로드 이름 표시
    const fileInput = document.getElementById('image-upload');
    const fileNameSpan = document.getElementById('file-name');

    if (fileInput && fileNameSpan) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            fileNameSpan.textContent = file ? file.name : '선택된 파일 없음';
        });
    }
    
    // 게시글 작성 폼 제출 (Netlify CMS와 연동)
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          // 폼 데이터 가져오기
          const title = document.getElementById('title').value;
          const content = document.getElementById('content').value;
          const primaryCategory = document.getElementById('primary-category').value;
          const secondaryCategory = document.getElementById('secondary-category').value;
          const fileInput = document.getElementById('image-upload');
          const file = fileInput.files[0];
            
            // 현재 날짜 생성
            const now = new Date();
            const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            try {
                // Netlify CMS API를 통해 게시글 저장
                const cms = window.CMS;
                const collection = cms.getBackend().getCollection('posts');

                 // 새 게시글 생성
      const entry = collection.createEntry('posts', {
        data: {
          title: title,
          date: new Date().toISOString(),
          category1: primaryCategory,
          category2: secondaryCategory,
          body: content
        },
        raw: '', // 이 값은 API에 의해 설정됩니다
      });

        // 이미지 업로드
        if (file) {
            const mediaLibrary = cms.getBackend().getMediaLibrary();
            const media = await mediaLibrary.persistMedia('posts', file);
            entry.data.thumbnail = media.url;
          }
          
          // 게시글 저장
          await cms.getBackend().persistEntry(entry);
                
                // 로컬 스토리지에 임시 저장 (실제 구현에서는 Netlify CMS API 사용)
                const existingPosts = JSON.parse(localStorage.getItem('nfpPosts') || '[]');
                existingPosts.unshift(newPost); // 최신글이 맨 위로
                localStorage.setItem('nfpPosts', JSON.stringify(existingPosts));
                
                // UI 업데이트
                allPosts = existingPosts;
                displayPosts(allPosts, 1);
                setupPagination(allPosts);
                
                // 게시글 저장
                await cms.getBackend().persistEntry(entry);
                
                // 사용자에게 피드백
                alert('게시글이 작성되었습니다.\n제목: ' + title);
                
                // 모달 닫기
                writeModal.style.display = 'none';
                
                // 폼 초기화
                postForm.reset();
                fileNameSpan.textContent = '선택된 파일 없음';
                
                // 게시글 목록 새로고침
                loadPosts();
                
                } 
                catch (error) {
                console.error('게시글 저장 중 오류 발생:', error);
                alert('게시글 저장에 실패했습니다. 다시 시도해주세요.');
                }

            });
            }

            // 게시글 데이터 로드 함수
async function loadPosts() {
    try {
      // Netlify CMS가 있는지 확인
      if (window.CMS && window.netlifyIdentity && window.netlifyIdentity.currentUser()) {
        // Netlify CMS API를 통해 게시글 로드
        const cms = window.CMS;
        const collection = cms.getBackend().getCollection('posts');
        const entries = await collection.getEntries();
        
        // API 응답을 내부 형식으로 변환
        allPosts = entries.map(entry => ({
          id: entry.slug,
          title: entry.data.title,
          date: new Date(entry.data.date).toISOString().split('T')[0],
          content: entry.data.body,
          category1: entry.data.category1,
          category2: entry.data.category2,
          image: entry.data.thumbnail
        }));
      } else {
        // 로컬 스토리지에서 게시글 가져오기 (개발용)
        allPosts = JSON.parse(localStorage.getItem('nfpPosts') || '[]');
        
        // 데이터가 없으면 샘플 데이터 생성
        if (allPosts.length === 0) {
          const samplePosts = generateSamplePosts(10);
          localStorage.setItem('nfpPosts', JSON.stringify(samplePosts));
          allPosts = samplePosts;
        }
      }
      
      // 게시글 표시
      filteredPosts = allPosts;
      displayPosts(allPosts, currentPage);
      setupPagination(allPosts);
    } catch (error) {
      console.error('데이터 로드 중 오류 발생:', error);
      document.getElementById('postList').innerHTML = '<div class="error">게시글을 불러오는데 실패했습니다.</div>';
    }
  }



    
    // 게시글 목록 표시 함수
    function displayPosts(posts, page) {
        const postListContainer = document.getElementById('postList');
        if (!postListContainer) return;
        
        postListContainer.innerHTML = ''; // 기존 내용 비우기
        
        // 페이지에 표시할 게시글 계산
        const start = (page - 1) * postsPerPage;
        const end = start + postsPerPage;
        const paginatedPosts = posts.slice(start, end);
        
        if (paginatedPosts.length === 0) {
            postListContainer.innerHTML = '<div class="no-posts">게시글이 없습니다.</div>';
            return;
        }
        
        // 게시글 목록을 담을 그리드 컨테이너 생성
        const gridContainer = document.createElement('div');
        gridContainer.className = 'post-grid';
        
        // 게시글 목록 생성
        paginatedPosts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            postCard.innerHTML = `
                <div class="post-image">
                    ${post.image ? `<img src="${post.image}" alt="${post.title}">` : '<div class="no-image">이미지 없음</div>'}
                </div>
                <div class="post-info">
                    <h3 class="post-title">${post.title}</h3>
                    <div class="post-meta">
                        <span class="post-date">${post.date}</span>
                        <span class="post-category">${post.category1} > ${post.category2}</span>
                    </div>
                    <p class="post-excerpt">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
                </div>
            `;
            
            // 게시글 클릭 시 상세 페이지로 이동
            postCard.addEventListener('click', function() {
                localStorage.setItem('currentPost', JSON.stringify(post));
                window.location.href = `post_detail.html?id=${post.id}`;
            });
            
            gridContainer.appendChild(postCard);
        });
        
        postListContainer.appendChild(gridContainer);
    }
    
    // 페이지네이션 설정 함수
    function setupPagination(posts) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;
        
        const pageCount = Math.ceil(posts.length / postsPerPage);
        paginationContainer.innerHTML = '';
        
        // 페이지네이션이 필요 없는 경우
        if (pageCount <= 1) return;
        
        // 페이지네이션 생성
        paginationContainer.className = 'pagination';
        
        // 이전 버튼
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                displayPosts(posts, currentPage);
                updateActivePageButton();
            }
        });
        paginationContainer.appendChild(prevBtn);
        
        // 페이지 번호 버튼
        for (let i = 1; i <= pageCount; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', function() {
                currentPage = i;
                displayPosts(posts, currentPage);
                updateActivePageButton();
            });
            paginationContainer.appendChild(pageBtn);
        }
        
        // 다음 버튼
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.addEventListener('click', function() {
            if (currentPage < pageCount) {
                currentPage++;
                displayPosts(posts, currentPage);
                updateActivePageButton();
            }
        });
        paginationContainer.appendChild(nextBtn);
        
        // 현재 활성화된 페이지 버튼 업데이트
        function updateActivePageButton() {
            const pageButtons = paginationContainer.querySelectorAll('.page-btn:not(.prev):not(.next)');
            pageButtons.forEach((btn, index) => {
                btn.classList.toggle('active', index + 1 === currentPage);
            });
        }
    }
    
    // 검색 기능 구현
    const searchInput = document.querySelector('.admin-search .form-control');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (!searchTerm) {
                // 검색어가 없으면 모든 게시글 표시
                displayPosts(allPosts, 1);
                setupPagination(allPosts);
                return;
            }
            
            // 검색어로 게시글 필터링
            const filteredPosts = allPosts.filter(post => 
                post.title.toLowerCase().includes(searchTerm) || 
                post.content.toLowerCase().includes(searchTerm) ||
                post.category1.toLowerCase().includes(searchTerm) ||
                post.category2.toLowerCase().includes(searchTerm)
            );
            
            // 검색 결과 표시
            currentPage = 1; // 첫 페이지로 리셋
            displayPosts(filteredPosts, currentPage);
            setupPagination(filteredPosts);
        });
        
        // 엔터 키로 검색
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
    
    // 초기 데이터 로드 (로컬 스토리지에서)
    function loadInitialData() {
        try {
            // 로컬 스토리지에서 게시글 가져오기 (실제 구현에서는 Netlify CMS API 사용)
            allPosts = JSON.parse(localStorage.getItem('nfpPosts') || '[]');
            
            // 데이터가 없으면 샘플 데이터 생성 (개발용)
            if (allPosts.length === 0) {
                const samplePosts = generateSamplePosts(10);
                localStorage.setItem('nfpPosts', JSON.stringify(samplePosts));
                allPosts = samplePosts;
            }
            
            displayPosts(allPosts, currentPage);
            setupPagination(allPosts);
        } catch (error) {
            console.error('데이터 로드 중 오류 발생:', error);
        }
    }
    
    // 샘플 게시글 생성 함수 (개발용)
    function generateSamplePosts(count) {
        const samplePosts = [];
        const categories = Object.keys(categoryMap);
        
        for (let i = 0; i < count; i++) {
            const primaryCat = categories[Math.floor(Math.random() * categories.length)];
            const secondaryCats = categoryMap[primaryCat];
            const secondaryCat = secondaryCats[Math.floor(Math.random() * secondaryCats.length)];
            
            const date = new Date();
            date.setDate(date.getDate() - i);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            samplePosts.push({
                id: Date.now() - i,
                title: `샘플 게시글 ${i + 1}`,
                date: formattedDate,
                content: `이것은 샘플 게시글 ${i + 1}의 내용입니다. 게시글 내용은 실제 구현 시 변경됩니다.`,
                category1: primaryCat,
                category2: secondaryCat,
                image: null // 실제 구현에서는 이미지 URL이 들어갑니다
            });
        }
        
        return samplePosts;
    }
    
    // 페이지 로드 시 초기 데이터 불러오기
    loadInitialData();
});