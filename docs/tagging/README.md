# 웹 분석 태깅 설계서 (Analytics Tagging)

본 문서는 프론트엔드 태깅 스키마, 이벤트 흐름, 품질/보안 가이드를 정의합니다. 현재 구현/배포 상태와 맞춰 운영 중 변경 시 함께 갱신합니다.

## 목적
- 사용자 행동 데이터를 표준 스키마로 수집하여 추천/분석/품질 개선에 활용
- 실시간 파이프라인(Kafka)로 이벤트를 전달하고, 중복·무결성 보장

## 수집/전송 흐름
- Web(React, Vite) → HTTPS `${VITE_API_BASE}` → `POST /events`(또는 `/ingest`) → FastAPI(백엔드) → Kafka(`news_events`)
- Firebase Hosting(정적)에서 웹이 배포되며, 백엔드는 HTTPS로 직접 수신합니다.

## 이벤트 페이로드 스키마
프런트엔드는 아래 필드로 단일 이벤트를 생성하고, 백엔드는 일부 필드를 보강/정규화합니다.

### 1) Event Metadata
- `event_id` (string) – 개별 로그 고유 ID. 기본 프런트에서 UUID 생성. 백엔드에서 누락 시 자동 생성.
- `event_time` (string, ISO8601) – 이벤트 발생 시각(UTC). 프런트 생성, 누락 시 백엔드에서 `ts` 기반 보강.
- `event_name` (string) – 행동명. 예) `page_in`, `click`, `dwell`, `search`, `toggle` 등.
- `client_version` (string) – 프런트 버전. `VITE_CLIENT_VERSION`에서 주입(없으면 기본값).

### 2) User & Session Context
- `user_id` (number|null) – 앱 내부 사용자 ID(비식별/최소 권한 준수). 로그인 없으면 null.
- `session_id` (string) – 세션 ID. 세션 스토리지에 저장되어 페이지 전환 간 유지.
- `device_type` (string) – `Mobile` | `Tablet` | `PC` (UA 기반 추정).
- `duration_sec` (number, optional) – 체류 시간 등 이벤트별 지속시간(예: `dwell`).
- `page` (string) – 라우팅 경로(`/for-you` 등).
- `current_url` (string) – 현재 페이지 URL. 프런트가 `url`도 보냄(백엔드가 `current_url`로 보강).
- `referrer` (string) – 진입 referrer.
  
### 3) 콘텐츠 식별자/맥락
- `contentId` (string, optional) – 동일 컨텐츠를 일관되게 식별. 예: `article:42`
- `meta.source` (string, optional) – 상호작용 맥락. 예: `card`, `hero`, `bookmark_item`
- `meta.action` (string, optional) – 토글 동작. 예: `like`, `dislike`, `bookmark`; `meta.value`(boolean)로 상태 표시

### 4) 도메인/추가 필드
- `article_id` (number, optional) – 카드/기사 연관 식별자.
- `position` (number, optional) – 목록에서의 위치 등.
- `meta` (object, optional) – 자유형 키-값. 예: `{ query: "ai", len: 2 }`.
- `ts` (string, ISO8601) – 프런트 전송 타임스탬프(레거시). 백엔드가 `event_time`으로 정규화.
- 백엔드가 추가: `ip`(추정 클라이언트 IP), `ua`(User-Agent)

### 5) 예시(JSON)
```
{
  "events": [
    {
      "event_id": "2f9e...",
      "event_time": "2025-10-12T07:30:00.000Z",
      "event_name": "click",
      "client_version": "0.1.0",
      "device_type": "Mobile",
      "session_id": "sid-abc...",
      "user_id": 123,
      "page": "/",
      "current_url": "https://news.example/",
      "referrer": "",
      "contentId": "article:42",
      "article_id": 42,
      "meta": { "source": "hero" }
    }
  ]
}
```

## 이벤트 타입(현 구현)
- 탐색/공통
- `page_in` – 라우트 진입 시 기록
- `dwell` – 라우트 체류 시간(ms → `duration_sec` 보강) 종료 시 비콘 전송
- 콘텐츠
  - `impression` – 카드/히어로 카드 화면 노출 시
  - `click` – 모든 클릭을 단일 이벤트로 수집(`contentId`로 컨텐츠 식별, `meta.source`로 맥락 구분)
- 계정/프로필
  - `login` / `logout`
  - `profile_view` / `profile_save`
- 북마크/반응/검색
  - `bookmark_list_view`
  - `click` – 북마크 목록 아이템 클릭 등(`contentId=article:<id>`, `meta.source=bookmark_item`)
  - `toggle` – 북마크/좋아요/싫어요 토글(`contentId=article:<id>`, `meta.action=bookmark|like|dislike`, `meta.value`)
  - `search` – 쿼리/길이/스코프 등 `meta` 포함

### 모달 취급 원칙
- 모달(기사 상세)은 별도 이벤트명이 아닌 `page_in`으로 기록합니다.
- 예) 기사 ID 42 모달 오픈: `page_in` with `page="/article/42?modal=1"`, `contentId="article:42"`
- 모달 닫힘 시 체류시간은 `dwell`로 전송(`duration_sec` 포함, beacon 사용)

## 전송/수신 사양
- 엔드포인트: `POST /events`(기본) 또는 `POST /ingest`(별칭)
- 본문: `{ events: Event[] }`
- 헤더: `Content-Type: application/json`
- 응답: `{ received: number, sent: number, topic: string, kafka: boolean }`

## Kafka
- 토픽: `news_events` (파티션: 3, 자동 생성 활성화)
- 키: `user_id` 또는 `session_id`(문자열)로 파티셔닝
- 프로듀서: 백엔드 `aiokafka.AIOKafkaProducer`

## 중복/품질
- 중복 제거: `event_id`를 고유키로 사용(컨슈머 DB 적재 시 UNIQUE 제약)
- 타임스탬프: 가능하면 프런트(`event_time`) 기준 사용, 서버에서 보강/검증
- 스키마 유연성: `meta`/`extra` 필드로 확장, 백엔드는 추가 키를 허용

## 보안/프라이버시
- PII 최소화: `user_id` 외 민감정보 금지, `meta`에 식별 가능 정보 금지
- HTTPS 전송 강제(Firebase→백엔드)
- CORS: Firebase 도메인 화이트리스트 운영

## 운영/버전
- 클라이언트 버전: `VITE_CLIENT_VERSION`로 주입(배포 파이프라인에서 설정)
- 스키마 변경 시 문서/예시 업데이트 및 하위호환 고려

## 향후(DB 적재)
- 컨슈머 서비스 추가하여 `analytics_events` 테이블에 적재
  - 칼럼 예: event_id(UNIQUE), event_time, event_name, session_id, user_id, client_version, device_type, page, current_url, referrer, article_id, duration_sec, click_id, ip, ua, meta_json, raw_json, received_at
  - upsert(충돌 무시)로 idempotent 처리

## 테스트 방법
- cURL(개발용, 로컬 HTTPS):
```
curl -k -X POST 'https://localhost:8000/events' \
  -H 'Content-Type: application/json' \
  -d '{"events":[{"event":"test","session_id":"dev-sid"}]}'
```
- 브라우저 DevTools → Network에서 `/events` 200 응답 확인
- Kafka 확인: `docker exec -it news_kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic news_events --from-beginning`
