# GPT 대화 리포트 생성기

이 프로젝트는 GPT와의 대화를 분석하여 고차원 리포트를 생성하고, 이를 이미지로 저장한 후 나중에 대화를 이어갈 수 있는 기능을 제공합니다.

## 기능

1. GPT와 실시간 대화
2. 대화 내용에 기반한 16항목 분석 리포트 자동 생성
3. 리포트를 HTML → PNG 이미지로 변환
4. Firebase Storage에 /reports/{code}.png로 저장 (EMV-YYYYMMDD-HHMMSS 형식)
5. 사용자에게 고유 코드번호 제공
6. 코드번호를 입력하여 이전 대화 내용 불러오기 및 이어서 대화
7. 누적된 대화를 바탕으로 리포트 재생성 기능

## 기술 스택

- Next.js 13 + TypeScript + API Routes
- Tailwind CSS
- OpenAI API (서버 측 처리)
- Firebase Storage (서버 측 처리)
- html-to-image

## 설치 및 실행

1. 저장소 클론:
```bash
git clone [저장소 URL]
cd gpt-report-generator
```

2. 의존성 설치:
```bash
npm install
```

3. `.env.local` 파일 설정:
환경변수를 설정하기 위해 `.env.local` 파일을 프로젝트 루트에 생성하고 다음과 같이 설정합니다:

```
OPENAI_API_KEY=your_openai_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```

4. 개발 서버 실행:
```bash
npm run dev
```

5. 브라우저에서 `http://localhost:3000` 열기

## API 엔드포인트

이 프로젝트는 다음과 같은 서버 API 엔드포인트를 제공합니다:

- `POST /api/chat` - GPT와의 대화 처리
- `POST /api/report` - 대화를 분석하여 리포트 생성
- `POST /api/storage` - 리포트 이미지 업로드
- `GET /api/storage?code={code}` - 리포트 이미지 정보 조회

## 배포

Vercel과 같은 플랫폼에 쉽게 배포할 수 있습니다:

```bash
npm run build
```

## 프로젝트 구조

- `/src/app`: Next.js 앱 라우터 및 페이지
- `/src/app/api`: 서버 API 라우트 (백엔드)
- `/src/components`: 재사용 가능한 컴포넌트
- `/src/types`: TypeScript 타입 정의
- `/src/utils`: 유틸리티 함수

## 보안 고려사항

- API 키와 관련된 모든 인증 정보는 서버 측에서만 처리됩니다.
- OpenAI API 호출은 서버 측에서 이루어지므로 클라이언트에는 API 키가 노출되지 않습니다.
- Firebase 연결도 서버 측에서 처리되어 보안이 강화되었습니다.

## 라이센스

MIT
