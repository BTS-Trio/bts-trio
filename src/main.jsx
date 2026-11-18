import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { metrics, pages, suggestions, topics } from './content.js';
import { ProofRecord, SearchResult } from './research.jsx';
import { GalaxyParticles } from './galaxy-motion.jsx';
import './styles.css';

const historyKey = 'bts-trio:search-history';
const route = (page, question = '') => '#' + page + (question ? '?' + new URLSearchParams({ q: question }) : '');

function readRoute() {
  const [name, query] = location.hash.slice(1).split('?');
  return { page: Object.hasOwn(pages, name) ? name : 'home', question: new URLSearchParams(query).get('q') ?? '' };
}

function readHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(historyKey) ?? '[]');
    return Array.isArray(saved) ? saved.filter(item => typeof item === 'string').slice(0, 20) : [];
  } catch {
    return [];
  }
}

function Mark() {
  return <span className="mark" aria-hidden="true"><i /><i /></span>;
}

function Sidebar({ page }) {
  const groups = [['home', 'search', 'galaxy', 'timeline', 'archive', 'reports'], ['about', 'sources', 'settings']];
  return <aside className="sidebar">
    <a className="brand" href="#home"><Mark /><span><b>BTS TRIO</b><small>BTS RAG Data Galaxy</small></span></a>
    <nav aria-label="주 메뉴">
      {groups.map((group, index) => <div className="nav-group" key={group[0]}>
        {index === 1 && <h2>프로젝트</h2>}
        {group.map(id => <a key={id} href={route(id)} aria-current={page === id ? 'page' : undefined}>
          <span aria-hidden="true">{pages[id]?.icon ?? '⌂'}</span>{pages[id]?.label ?? '홈'}
        </a>)}
      </div>)}
    </nav>
    <footer className="sidebar-footer">
      <div className="art side-art" aria-hidden="true" />
      <div><strong>Beyond The Data</strong><p>BTS의 기록을 데이터로 탐색하고,<br />근거로 검증하는<br />AI 지식 플랫폼</p></div>
    </footer>
  </aside>;
}

function SearchForm({ question = '', onSearch }) {
  const [value, setValue] = useState(question);
  return <form className="search-form" role="search" onSubmit={event => {
    event.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }}>
    <span className="spark" aria-hidden="true">✦</span>
    <input aria-label="BTS에 대해 질문하기" value={value} onChange={event => setValue(event.target.value)}
      placeholder="BTS에 대해 궁금한 내용을 질문하세요." required maxLength={300} />
    <button type="submit" aria-label="검색"><span className="magnifier" aria-hidden="true" /></button>
  </form>;
}

function Galaxy({ motionPaused, toggleMotion }) {
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    if (selected && !dialog.current.open) dialog.current.showModal();
  }, [selected]);

  return <section className="galaxy" aria-label="BTS 행성과 일곱 데이터 노드">
    <div className="art galaxy-art" aria-hidden="true" />
    <div className="galaxy-motion" aria-hidden="true">
      <div className="nebula"><i /><i /></div>
      <GalaxyParticles paused={motionPaused || selected !== null} />
      <i className="planet-halo" />
      <div className="stars nearby-stars"><i /><i /><i /><i /><i /><i /><i /></div>
    </div>
    <button className="planet" type="button" aria-label="BTS 행성 · 데이터 갤럭시 미리보기"
      aria-haspopup="dialog" onClick={event => { trigger.current = event.currentTarget; setSelected('galaxy'); }} />
    {topics.map((topic, index) => <div className="planet-float" key={topic.id} style={{
      '--x': topic.x + '%', '--y': topic.y + '%', '--size': topic.w + '%',
      '--delay': -(index + 1.2) + 's', '--period': (7 + index * .55) + 's',
    }}>

      <button type="button" className={'planet' + (selected === topic.id ? ' selected' : '')}
        aria-label={topic.label + ' 미리보기'} aria-haspopup="dialog"
        onClick={event => { trigger.current = event.currentTarget; setSelected(topic.id); }}><span className="planet-surface" aria-hidden="true" /></button>
    </div>)}
    <button type="button" className="motion-toggle" aria-label="갤럭시 움직임 일시정지"
      aria-pressed={motionPaused} onClick={toggleMotion}>
      <span aria-hidden="true">{motionPaused ? "▷" : "Ⅱ"}</span> 움직임 {motionPaused ? "재생" : "멈춤"}
    </button>
    <dialog className="node-preview" ref={dialog} aria-labelledby="preview-title" onClose={() => {
      setSelected(null);
      trigger.current?.focus();
    }} onClick={event => {
      if (event.target === event.currentTarget) dialog.current.close();
    }}>
      {selected && <div className="preview-body">
        <button className="close" type="button" aria-label="미리보기 닫기" onClick={() => dialog.current.close()}>×</button>
        <span className="preview-icon" aria-hidden="true">{pages[selected].icon}</span>
        <h2 id="preview-title">{pages[selected].label}</h2>
        <p>{pages[selected].description}</p>
        <p className="muted">연결 자료 수 · 데이터 연동 대기</p>
        <a className="action" href={route(selected)} onClick={() => dialog.current.close()}>상세 페이지로 이동 <span aria-hidden="true">→</span></a>
      </div>}
    </dialog>
  </section>;
}

function HistoryList({ history, onSearch }) {
  if (!history.length) return <p className="muted empty">아직 검색 기록이 없습니다.</p>;
  return <ul className="history-list">{history.map(question => <li key={question}>
    <button type="button" onClick={() => onSearch(question)}><span aria-hidden="true">◷</span><span>{question}</span><span aria-hidden="true">›</span></button>
  </li>)}</ul>;
}

function Arrow() {
  return <span className="arrow" aria-hidden="true">→</span>;
}

function RightRail({ history, onSearch }) {
  const [issueTab, setIssueTab] = useState('issues');
  return <aside className="rail" aria-label="검색과 근거 바로가기">
    <a className="panel feature" href="#search">
      <span className="feature-art stacked" aria-hidden="true"><i /><i /><i><Mark /></i></span>
      <span><strong>AI 검색 (RAG)</strong><small>수집한 자료로 질문하고 답변의 근거를 확인하세요.</small></span>
      <Arrow />
    </a>
    <a className="panel feature" href="#proof">
      <span className="feature-art shield" aria-hidden="true">✓</span>
      <span><strong>근거 검증 (Proof Lab)</strong><small>AI 답변의 출처, 근거 ID, 원문을 확인하세요.</small></span>
      <Arrow />
    </a>
    <section className="panel issue">
      <header aria-label="이슈 보기">
        <button type="button" aria-pressed={issueTab === 'issues'} onClick={() => setIssueTab('issues')}>주요 이슈</button>
        <button type="button" aria-pressed={issueTab === 'updates'} onClick={() => setIssueTab('updates')}>최근 업데이트</button>
      </header>
      <div className="art concert-art" aria-hidden="true" />
      <a className="issue-link" href={route('issues', issueTab === 'updates' ? 'updates' : '')}>
        <span><strong>{issueTab === 'issues' ? '검증된 이슈 준비 중' : '등록된 업데이트 없음'}</strong>
          <small>{issueTab === 'issues' ? '자료 연결 후 확인된 이슈를 표시합니다.' : '등록된 자료의 업데이트가 여기에 표시됩니다.'}</small></span>
        <Arrow />
      </a>
    </section>
    <section className="panel history">
      <header><h2><span aria-hidden="true">◷　</span>최근 검색 기록</h2><a href="#history">전체보기 ›</a></header>
      <HistoryList history={history.slice(0, 3)} onSearch={onSearch} />
    </section>
  </aside>;
}

function Home({ history, onSearch }) {
  const [motionPaused, setMotionPaused] = useState(false);
  return <main className="home" id="main" data-motion-paused={motionPaused}>
    <div className="center">
      <header className="hero">
        <div className="art hero-art" aria-hidden="true" />
        <div className="nebula hero-nebula" aria-hidden="true"><i /><i /></div>
        <div className="stars hero-stars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><b className="meteor" /></div>
        <h1 className="sr-only">BTS Data Galaxy</h1>
        <p className="sr-only">RAG 기반 BTS 지식 탐색 플랫폼</p>
      </header>
      <div className="home-search">
        <div className="art search-edge search-edge-left" aria-hidden="true" />
        <div className="art search-edge search-edge-right" aria-hidden="true" />
        <SearchForm onSearch={onSearch} />
        <div className="suggestions">
          <strong><span className="spark" aria-hidden="true">✦</span> 추천 질문</strong>
          {suggestions.map(question => <button type="button" key={question} onClick={() => onSearch(question)}>{question}</button>)}
        </div>
      </div>
      <Galaxy motionPaused={motionPaused} toggleMotion={() => setMotionPaused(paused => !paused)} />
      <section className="metrics" aria-label="주요 통계">
        {metrics.map(metric => <a className="panel metric" key={metric.label} href={route(metric.page)}>
          <span className="metric-icon" aria-hidden="true">{metric.icon}</span>
          <span><small>{metric.label}</small><strong>—</strong><small className="muted">검증 자료 대기</small></span>
        </a>)}
      </section>
    </div>
    <RightRail history={history} onSearch={onSearch} />
  </main>;
}

function Research({ page, question, history, onSearch, clearHistory }) {
  const info = pages[page];
  const isUpdates = page === 'issues' && question === 'updates';
  const title = isUpdates ? '최근 업데이트' : info.label;
  const empty = {
    proof: '검색 결과에서 근거 ID를 선택하면 검증 기록을 확인할 수 있습니다.',
    issues: isUpdates ? '등록된 업데이트가 없습니다.' : '등록된 이슈가 없습니다.',
    search: '질문을 입력하면 연결된 그래미 검증 자료에서 근거를 찾습니다.',
    about: '현재는 홈 화면, 주제별 탐색과 검색 기록을 이용할 수 있습니다.',
  };

  return <main id="main" className="research">
    <header className="research-hero">
      <nav aria-label="현재 위치"><a href="#home">홈</a><span aria-hidden="true"> / </span>{title}</nav>
      <span className="preview-icon" aria-hidden="true">{info.icon}</span>
      <h1>{title}</h1><p>{info.description}</p>
    </header>
    {page === 'search' && <SearchForm key={question} question={question} onSearch={onSearch} />}
    <div className="research-grid">
      <section className="panel research-content">
        <h2>{page === 'search' ? '검색 결과' : page === 'settings' ? '검색 기록 관리' : page === 'history' ? '저장한 질문' : page === 'about' ? '현재 이용 범위' : '자료 탐색'}</h2>
        {page === 'search' && question ? <SearchResult key={question} question={question} />
          : page === 'proof' && question ? <ProofRecord key={question} id={question} />
          : page === 'galaxy' ? <ul className="topic-list">{topics.map(topic => <li key={topic.id}>
          <a href={route(topic.id)}><strong>{topic.icon}　{topic.label}</strong><span>{topic.description}</span></a>
        </li>)}</ul>
          : page === 'history' ? <HistoryList history={history} onSearch={onSearch} />
          : page === 'settings' ? <div className="empty"><p>{history.length ? '저장된 질문 ' + history.length + '개' : '저장된 질문이 없습니다.'}</p>
            <button type="button" className="action" disabled={!history.length} onClick={clearHistory}>검색 기록 지우기</button></div>
          : <div className="empty">
            <p className="muted">{empty[page] ?? '데이터 연동 후 확인된 자료를 표시합니다.'}</p></div>}
      </section>
      <aside className="panel research-content">
        <h2>출처와 근거</h2><p className="muted">검색 결과에서 근거 ID를 선택하면 Proof Lab에서 출처와 원문 링크를 확인할 수 있습니다.</p>
        {page === 'proof' ? <a className="action" href="#sources">데이터 &amp; 출처 →</a> : <a className="action" href="#proof">Proof Lab 열기 →</a>}
      </aside>
    </div>
  </main>;
}

function App() {
  const [{ page, question }, setRoute] = useState(readRoute);
  const [history, setHistory] = useState(readHistory);
  const firstRender = useRef(true);

  useEffect(() => {
    const navigate = () => setRoute(readRoute());
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch {
      // Keep history available during this session when storage is blocked.
    }
  }, [history]);

  useEffect(() => {
    document.title = page === 'home' ? 'BTS TRIO | BTS Data Galaxy' : pages[page].label + ' | BTS TRIO';
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const main = document.getElementById('main');
    main.tabIndex = -1;
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [page, question]);

  function search(value) {
    setHistory(previous => [value, ...previous.filter(item => item !== value)].slice(0, 20));
    location.hash = route('search', value);
  }

  return <div className="shell">
    <a href="#main" className="skip" onClick={event => {
      event.preventDefault();
      const main = document.getElementById('main');
      main.tabIndex = -1;
      main.focus();
    }}>본문 바로가기</a>
    <Sidebar page={page} />
    {page === 'home' ? <Home history={history} onSearch={search} />
      : <Research page={page} question={question} history={history} onSearch={search} clearHistory={() => setHistory([])} />}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);






