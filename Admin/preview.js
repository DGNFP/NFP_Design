// NetlifyCMS 프리뷰 템플릿 설정
if (window.CMS) {
    CMS.registerPreviewTemplate('posts', ({ entry }) => {
      const { title, category1, category2, thumbnail, body_image, body, date } = entry.get('data').toJS();
      
      // 날짜 포맷팅
      const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // HTML 템플릿 생성
      const html = `
        <div class="post-container">
          <div class="post-header">
            <h1 class="post-title">${title}</h1>
            <div class="post-meta">
              <span><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
              <span><i class="fas fa-tag"></i> ${category1} > ${category2}</span>
            </div>
          </div>
          
          <div class="post-content">
            ${thumbnail ? `
              <div class="post-image">
                <img src="${thumbnail}" alt="${title}">
              </div>
            ` : ''}
            
            ${body_image && body_image !== thumbnail ? `
              <div class="post-image">
                <img src="${body_image}" alt="${title} 본문 이미지">
              </div>
            ` : ''}
            
            <div class="post-body">
              ${body}
            </div>
          </div>
        </div>
      `;
      
      // 미리보기 DOM 요소 생성
      const element = document.createElement('div');
      element.classList.add('post-preview');
      element.innerHTML = html;
      
      return element;
    });
  }
  
  // NetlifyCMS와 로컬 스토리지 동기화 (옵션)
  function syncLocalStorageWithCMS() {
    if (window.CMS && window.CMS.getStore) {
      const store = window.CMS.getStore();
      const entries = store.getState().entries;
      
      if (entries && entries.posts) {
        const cmsPosts = entries.posts.map(entry => {
          const data = entry.data;
          return {
            id: entry.slug,
            title: data.title,
            body: data.body,
            category1: data.category1,
            category2: data.category2,
            thumbnail: data.thumbnail,
            body_image: data.body_image,
            date: new Date(data.date).toISOString().split('T')[0],
            time: new Date(data.date).toTimeString().split(' ')[0],
            createdAt: new Date(data.date).toISOString()
          };
        });
        
        // 로컬 스토리지에 저장
        if (cmsPosts.length > 0) {
          const localPosts = JSON.parse(localStorage.getItem('posts')) || [];
          
          // CMS 게시글과 로컬 게시글 병합 (중복 ID 제거)
          const mergedPosts = [...cmsPosts];
          localPosts.forEach(localPost => {
            if (!cmsPosts.some(cmsPost => cmsPost.id === localPost.id)) {
              mergedPosts.push(localPost);
            }
          });
          
          // 날짜순 정렬
          mergedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          localStorage.setItem('posts', JSON.stringify(mergedPosts));
        }
      }
    }
  }
  
  // CMS가 로드되면 동기화 시도
  document.addEventListener('DOMContentLoaded', () => {
    if (window.CMS) {
      window.CMS.registerEventListener({
        name: 'preSave',
        handler: () => {
          setTimeout(syncLocalStorageWithCMS, 1000);
        },
      });
      
      window.CMS.registerEventListener({
        name: 'postPublish',
        handler: () => {
          setTimeout(syncLocalStorageWithCMS, 1000);
        },
      });
    }
  });