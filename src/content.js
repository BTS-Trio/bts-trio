export const topics = [
  { id: 'music', label: '앨범 · 음악', icon: '♫', x: 51.3, y: 11.5, w: 10.6, description: '앨범, 수록곡, 발매 기록과 관련 자료를 탐색합니다.' },
  { id: 'achievements', label: '주요 성과', icon: '♜', x: 74, y: 21.9, w: 10.3, description: '차트, 수상, 공연 등 주요 성과와 원문 출처를 확인합니다.' },
  { id: 'members', label: '멤버 정보', icon: '♙', x: 81.1, y: 47.3, w: 10.7, description: '멤버별 프로필과 공식 활동을 살펴봅니다.' },
  { id: 'content', label: '활동 · 콘텐츠', icon: '▷', x: 67.6, y: 68.1, w: 10.5, description: '공식 영상과 활동 콘텐츠를 탐색합니다.' },
  { id: 'impact', label: '글로벌 영향력', icon: '◎', x: 34.4, y: 68.1, w: 10.7, description: '글로벌 활동과 관련된 자료와 보도를 살펴봅니다.' },
  { id: 'timeline', label: '활동 타임라인', icon: '▦', x: 21.6, y: 47.4, w: 11.2, description: '공식 자료에 기록된 활동을 시간순으로 살펴봅니다.' },
  { id: 'press', label: '보도 · 기사', icon: '▤', x: 28.2, y: 22.2, w: 10.4, description: '관련 기사와 보도 자료를 출처별로 살펴봅니다.' },
];

export const pages = {
  search: { label: 'AI 검색 (RAG)', icon: '✧', description: '질문을 입력하고 관련 자료와 답변의 근거를 함께 확인하는 공간입니다.' },
  galaxy: { label: '데이터 갤럭시', icon: '✣', description: '일곱 가지 주제별로 BTS 관련 자료를 탐색하는 공간입니다.' },
  archive: { label: '아카이브', icon: '▱', description: '기사, 음악, 영상 등 출처가 확인된 자료를 모아 보는 공간입니다.' },
  reports: { label: '분석 리포트', icon: '▥', description: '검증된 자료를 토대로 작성한 분석을 모아 보는 공간입니다.' },
  about: { label: '프로젝트 소개', icon: 'ⓘ', description: 'BTS 관련 자료를 탐색하고 출처와 근거를 확인하는 지식 플랫폼입니다.' },
  sources: { label: '데이터 & 출처', icon: '▱', description: '연결된 자료의 원문, 출처, 수집 기준을 확인하는 공간입니다.' },
  settings: { label: '설정', icon: '⚙', description: '이 브라우저에 저장된 검색 기록을 관리합니다.' },
  proof: { label: '근거 검증 (Proof Lab)', icon: '◇', description: 'AI 답변에 쓰인 출처, 근거 ID와 원문을 확인하는 공간입니다.' },
  issues: { label: '주요 이슈', icon: '✦', description: '출처가 검증된 주제와 최근 업데이트를 살펴보는 공간입니다.' },
  history: { label: '최근 검색 기록', icon: '◷', description: '이 브라우저에서 입력한 질문을 다시 열 수 있습니다.' },
  ...Object.fromEntries(topics.map(topic => [topic.id, topic])),
};

export const suggestions = ['BTS의 주요 성과는?', '완전체 활동은 언제부터?', '멤버별 주요 활동 정리', '군 복무와 복귀 일정'];
export const metrics = [
  { label: '활동 연수', icon: '♙', page: 'timeline' },
  { label: '글로벌 차트', icon: '◎', page: 'impact' },
  { label: '주요 수상', icon: '♜', page: 'achievements' },
  { label: '공식 콘텐츠', icon: '▷', page: 'content' },
];
