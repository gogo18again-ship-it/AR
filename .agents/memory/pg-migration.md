---
name: PostgreSQL 전환
description: HR 시스템 API 서버의 SQLite → PostgreSQL 마이그레이션 결정 사항
---

## 완료된 전환

better-sqlite3 제거, Replit 내장 PostgreSQL + Drizzle ORM 사용.

## 스키마 관리

- 스키마 정의: `lib/db/src/schema/index.ts` (11개 테이블)
- 개발 적용: `pnpm --filter @workspace/db run push`
- 프로덕션 적용: Replit Publish 시 자동 diff 적용 (코드로 직접 마이그레이션 금지)

**Why:** Replit 관리형 PostgreSQL은 Publish 흐름이 스키마 diff를 자동 처리하므로 커스텀 마이그레이션 스크립트를 작성하면 안 됨.

## 시드 전략

- 파일: `artifacts/api-server/src/lib/seed.ts`
- 조건: `NODE_ENV !== 'production'` AND `employees COUNT = 0`일 때만 실행
- `index.ts`에서 try/catch로 감싸 테이블 미생성 시 경고만 출력

**Why:** 프로덕션에서 시드 자동 실행 시 실데이터 덮어쓰기 위험 차단.

## 데이터 이전

- 1회성 이전 스크립트: `artifacts/api-server/scripts/migrate-sqlite-to-pg.mjs`
- employees: ON CONFLICT (employee_number) DO NOTHING으로 중복 방지
- 자식 테이블: employees 이전 후 idMap(SQLite id→PG id) 기반 삽입
- PostgreSQL에 이미 데이터 있으면 전체 건너뜀

## timestamp 타입 처리

`created_at`, `updated_at`, `uploaded_at`은 Drizzle `timestamp().defaultNow()` 사용.
라우트 mapper에서 Date 객체를 그대로 반환 — `res.json()`이 ISO 문자열로 직렬화함.
(SQLite 형식 `"2024-01-01 00:00:00"` → ISO `"2024-01-01T00:00:00.000Z"` 형식 변경은 프론트엔드에 영향 없음 확인)
