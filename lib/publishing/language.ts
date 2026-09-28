export type Language = 'en' | 'ko'
export const languageOf = (value: unknown): Language => value === 'ko' ? 'ko' : 'en'
export const blogPath = (language: Language) => language === 'ko' ? '/blog/ko/' : '/blog/'
export const searchPath = (language: Language) => language === 'ko' ? '/blog/search/ko/' : '/blog/search/'
export const messages = {
  en: {
    home: 'Home', blog: 'Blog', search: 'Search', name: 'Name', password: 'Password', passwordHint: '(for deletion)',
    write: 'Write', remove: 'Delete', more: 'More', guestbook: 'Guestbook', comments: 'Comments',
    leaveGuestbook: 'Leave a message...', leaveComment: 'Leave a comment...',
    guestbookMessage: 'Guestbook message', commentMessage: 'Comment', emptyComments: 'No messages yet.', emptyPosts: 'No published posts yet.',
    loading: 'Loading…', saving: 'Saving…', saved: 'Saved.', loadFailed: 'Could not load comments. Please try again.',
    saveFailed: 'Could not save. Your input has been kept.', previewDisabled: 'Comments are disabled in preview.',
    readComments: 'Read the guestbook / comments', back: 'Back', article: 'article', updated: 'Updated', minutes: 'min read',
    searchPrompt: 'Enter a search term.', searchHint: 'Optics, PyTorch, holography…', searching: 'Searching…', results: 'results',
    firstResults: 'First 30 shown', searchFailed: 'Search could not load. Please reload or browse the blog.',
    noScriptSearch: 'Search needs JavaScript. Browse', allArticles: 'all articles',
    copy: 'Copy', copied: 'Copied', copyFallback: 'Select code to copy', references: 'References',
  },
  ko: {
    home: '홈', blog: '블로그', search: '검색', name: '이름', password: '비밀번호', passwordHint: '(삭제 시 입력)',
    write: '작성', remove: '삭제', more: '더 보기', guestbook: '방명록', comments: '댓글',
    leaveGuestbook: '방명록 남기기...', leaveComment: '댓글 남기기...',
    guestbookMessage: '방명록 내용', commentMessage: '댓글 내용', emptyComments: '아직 남겨진 글이 없습니다.', emptyPosts: '아직 발행된 글이 없습니다.',
    loading: '불러오는 중…', saving: '저장 중…', saved: '저장했습니다.', loadFailed: '댓글을 불러올 수 없습니다. 다시 시도해주세요.',
    saveFailed: '저장하지 못했습니다. 입력 내용은 그대로 남아 있습니다.', previewDisabled: '미리보기에서는 댓글을 작성할 수 없습니다.',
    readComments: '방명록 / 댓글 읽기', back: '돌아가기', article: '게시글', updated: '수정', minutes: '분 소요',
    searchPrompt: '검색어를 입력하세요.', searchHint: '광학, PyTorch, 홀로그래피…', searching: '검색 중…', results: '개 결과',
    firstResults: '처음 30개 표시', searchFailed: '검색을 불러올 수 없습니다. 새로고침하거나 글 목록을 이용해주세요.',
    noScriptSearch: '검색에는 자바스크립트가 필요합니다.', allArticles: '전체 글 보기',
    copy: '복사', copied: '복사됨', copyFallback: '코드를 선택해 복사해주세요', references: '참고문헌',
  },
}

const errors = {
  request: ['Invalid comment request.', '올바른 댓글 요청이 아닙니다.'],
  password: ['Use a deletion password of 4–128 characters.', '삭제용 비밀번호를 4~128자로 입력해주세요.'],
  content: ['Enter a name (up to 60 characters) and message (up to 4,000 characters).', '이름은 60자, 내용은 4,000자 이내로 입력해주세요.'],
  id: ['Invalid comment ID.', '올바른 댓글 번호가 아닙니다.'],
  thread: ['Invalid comment thread.', '올바른 게시판이 아닙니다.'],
  post: ['Published article not found.', '발행된 글을 찾을 수 없습니다.'],
  rate: ['Please wait before trying again.', '잠시 후 다시 시도해주세요.'],
  page: ['Invalid page.', '올바른 페이지가 아닙니다.'],
  save: ['Could not save the comment.', '댓글을 저장할 수 없습니다.'],
  credentials: ['Check the comment and deletion password.', '댓글 또는 비밀번호를 확인해주세요.'],
  origin: ['This request is not allowed.', '허용되지 않은 요청입니다.'],
  format: ['Unsupported input format.', '지원하지 않는 입력 형식입니다.'],
  size: ['The input is too large.', '입력이 너무 큽니다.'],
  input: ['Invalid input.', '올바른 입력이 아닙니다.'],
  service: ['Comments are unavailable. Please try again later.', '댓글 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.'],
}
export type CommentErrorCode = keyof typeof errors
export const commentError = (code: CommentErrorCode, language: Language) => errors[code][language === 'ko' ? 1 : 0]
