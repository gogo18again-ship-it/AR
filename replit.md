# 명지피앤피 인사·총무 DX 시스템 V1

인사·총무 담당자 1명이 사용하는 내부 업무 관리 시스템. 직원별 모든 이력과 관련 문서를 한 화면에서 조회할 수 있는 Employee 360 View가 핵심.

## Run & Operate

- `pnpm --filter @workspace/hr-system run dev` — 프론트엔드 (포트 자동 할당)
- `pnpm --filter @workspace/api-server run dev` — API 서버 (포트 8080)
- `pnpm run typecheck` — 전체 타입 체크
- `pnpm --filter @workspace/api-spec run codegen` — OpenAPI 훅/스키마 재생성

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + Noto Sans KR
- Backend: Express 5
- DB: SQLite (better-sqlite3) — `artifacts/api-server/data/hr.db`
- API codegen: Orval (OpenAPI → React Query hooks + Zod schemas)

## Where things live

- `lib/api-spec/openapi.yaml` — API 계약 (단일 소스)
- `lib/api-client-react/src/generated/` — 생성된 React Query 훅
- `lib/api-zod/src/generated/` — 생성된 Zod 스키마
- `artifacts/hr-system/src/` — 프론트엔드 소스
- `artifacts/api-server/src/lib/db.ts` — SQLite 연결 및 스키마·시드 데이터
- `artifacts/api-server/src/routes/` — API 라우트 (dashboard, employees, schedules, documents)

## Architecture decisions

- PostgreSQL 대신 SQLite 사용: 1인 사용 내부 시스템이므로 별도 DB 서버 불필요
- Employee 360 View: 직원 1명의 모든 이력을 탭 + 타임라인으로 단일 화면에 표시
- 로그인 없음: 1인 담당자 시스템이므로 인증 불필요
- OpenAPI 계약 우선 개발: 스펙 → codegen → 훅 사용 순서 유지

## Product

- **대시보드**: 총 직원 수, 외국인 근로자 수, 비자 만료 예정, 교육 예정, 보험 갱신 예정, ISO 일정 통계
- **직원관리**: 목록 검색(성명/부서/직급) + Employee 360 View (기본정보·인사이력·교육·상벌·징계·면담·외국인정보·첨부파일 탭 + 타임라인)
- **일정관리**: 비자(90일 전 알림), 교육(30일 전), ISO 일정, 보험 갱신(30일 전)
- **문서관리**: 카테고리별 문서 저장 및 검색

## User preferences

- 한국어 UI 전용
- 다크모드 없음
- 이모지 사용 금지

## Gotchas

- SQLite DB 파일: `artifacts/api-server/data/hr.db` (서버 시작 시 자동 생성/시드)
- `better-sqlite3`는 `pnpm-workspace.yaml`의 `onlyBuiltDependencies`에 등록되어 있음
- OpenAPI 스펙 변경 시 반드시 codegen 재실행 필요

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
