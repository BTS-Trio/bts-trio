# BTS TRIO · BTS Data Galaxy

갤럭시 홈에서 BTS 관련 자료를 검색하고 Proof Lab에서 근거를 확인하는 프로젝트입니다. React/Vite로 화면을 빌드하고 Python/FastAPI가 화면과 API를 함께 제공합니다.

## Windows 11에서 실행하기

VS Code에서 이 README가 있는 **bts-trio** 폴더를 열고, **터미널 → 새 터미널**에서 아래 명령을 실행합니다. Node.js 22.12 이상과 Python 3.12를 기준으로 작성했습니다.

처음 한 번 설치하고 화면을 빌드합니다.

```powershell
npm.cmd ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm.cmd run build
```

서버를 시작하고 브라우저에서 http://127.0.0.1:8000/ 를 엽니다. 종료하려면 터미널에서 **Ctrl+C**를 누릅니다.

```powershell
.\.venv\Scripts\python.exe -m uvicorn server.main:app --host 127.0.0.1 --port 8000
```

화면을 수정하면서 개발하려면 위 서버를 켜 둔 채 새 터미널에서 `npm.cmd run dev`를 실행하고 Vite가 표시한 Local 주소를 엽니다. 배포용 화면을 갱신할 때는 `npm.cmd run build`를 다시 실행합니다.

## 검색 데모

1. 홈에서 **BTS의 주요 성과는?**을 선택하거나 **Butter는 그래미에서 수상했나요?**를 검색합니다.
2. 결과의 **G-01** 또는 **G-02**를 선택해 Proof Lab에서 검증 기록을 확인합니다.
3. **공식 원문 열기**를 선택하면 Recording Academy의 BTS 아티스트 페이지가 열립니다.

현재 검색은 공식 원문을 대조한 그래미 기록 2건, 팝업 공지 2건, 가오슝 투어 일정 3건을 사용합니다. 질문의 키워드로 기록을 골라 답변을 구성합니다. 벡터 검색과 생성형 모델은 이후 연동 단계입니다.

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `src/main.jsx` | 갤럭시 홈과 페이지 이동 |
| `src/research.jsx` | API 검색 결과와 Proof Lab 검증 기록 |
| `server/main.py` | FastAPI, 근거 검색, 빌드된 화면 제공 |
| `server/evidence.json` | Supabase 설정 없이 실행할 때 사용하는 확인된 근거 |

서버가 실행 중이면 http://127.0.0.1:8000/docs 에서 API를 테스트할 수 있습니다.

GitHub에 올릴 때 이 폴더를 저장소 루트로 사용합니다. 설치 파일, 빌드 결과, 로컬 환경 파일은 Git에서 제외됩니다. 공개 웹 링크를 제출하려면 빌드된 화면과 FastAPI 서버를 함께 배포합니다.

## 팀원용으로 Render에 배포하기

1. 이 프로젝트 폴더를 GitHub의 비공개 저장소에 올립니다.
2. Render에 로그인한 뒤 **New → Blueprint**에서 해당 저장소를 연결합니다.
3. 비밀값 **BTS_TRIO_PREVIEW_PASSWORD**에 팀 검토용 영문·숫자 비밀번호를 입력합니다.
4. 배포가 끝나면 Render가 표시한 HTTPS 주소를 엽니다. 로그인 창에서 사용자 이름 **team**과 설정한 비밀번호를 입력합니다.
5. 홈과 **검색 → Proof Lab**을 확인한 뒤 팀원에게 링크와 비밀번호를 전달합니다.

Docker 빌드는 React를 먼저 빌드하고 FastAPI로 화면과 API를 함께 제공합니다. 검토용 비밀번호는 Render에서 설정하고 GitHub에는 저장하지 않습니다.


## Supabase 근거 테이블 연결

Supabase의 `public.bts_evidence`에는 행 단위 보안이 켜져 있습니다. FastAPI는 서버 전용 키로 읽습니다. Render의 **bts-trio-preview → Environment**에서 아래 두 값을 함께 설정하고 배포합니다.

- `SUPABASE_URL` · Supabase 프로젝트의 API URL
- `SUPABASE_SECRET_KEY` · Supabase의 **Secret key**. Render 환경 변수에 직접 저장합니다.

두 환경 변수 없이 실행하면 로컬 JSON에서 검증 자료를 읽습니다. 두 값이 설정된 서버는 Supabase를 사용하며, 데이터베이스 오류가 발생하면 API가 503을 반환합니다.
