const fs = require('fs');
const { marked } = require('marked');

// 마크다운 텍스트
const markdownText = '# 이건 제목입니다\n\n이것은 본문입니다.';

// 마크다운을 HTML로 변환
const htmlText = marked(markdownText);

// HTML을 파일로 저장
fs.writeFileSync('output.html', htmlText);

console.log('HTML 파일로 저장되었습니다.');