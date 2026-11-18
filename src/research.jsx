import React, { useEffect, useState } from 'react';

function useApi(path, question) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const request = question === undefined ? {} : {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    };

    async function load() {
      try {
        const response = await fetch(path, { ...request, signal: controller.signal });
        if (response.status === 404) {
          setState({ status: 'missing' });
          return;
        }
        if (!response.ok) throw new Error('Request failed');
        const data = await response.json();
        if (!controller.signal.aborted) setState({ status: 'ready', data });
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error' });
      }
    }

    load();
    return () => controller.abort();
  }, [path, question]);

  return state;
}

function Status({ status }) {
  const labels = {
    loading: '자료를 확인하고 있습니다.',
    missing: '등록된 근거를 찾을 수 없습니다.',
    error: '서버에 연결할 수 없습니다. 잠시 후 페이지를 새로고침해 주세요.',
  };
  return <p className="muted" role="status">{labels[status]}</p>;
}

export function SearchResult({ question }) {
  const result = useApi('/api/search', question);
  return <div className="empty">
    <p className="submitted">{question}</p>
    {result.status === 'ready' ? <>
      <p className="answer">{result.data.answer}</p>
      {result.data.evidence.length > 0 && <ul className="topic-list evidence-list" aria-label="검색 근거">
        {result.data.evidence.map(item => <li key={item.id}>
          <a href={'#proof?' + new URLSearchParams({ q: item.id })}>
            <strong>{item.id} · {item.song}</strong>
            <span>{item.source} · Proof Lab에서 검증 기록 보기 →</span>
          </a>
        </li>)}
      </ul>}
    </> : <Status status={result.status} />}
  </div>;
}

export function ProofRecord({ id }) {
  const result = useApi('/api/evidence/' + encodeURIComponent(id));
  if (result.status !== 'ready') return <div className="empty"><Status status={result.status} /></div>;
  const item = result.data;
  return <article className="empty proof-record">
    <p className="submitted">{item.id} · {item.song}</p>
    <p>제{item.ceremony}회 그래미 · {item.category}</p>
    <p>{item.record}</p>
    <p className="muted">출처 · {item.source}</p>
    <a className="action" href={item.url} target="_blank" rel="noopener noreferrer">공식 원문 열기 ↗</a>
  </article>;
}

