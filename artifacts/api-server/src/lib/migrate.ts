/**
 * SQLite 시절 런타임 마이그레이션 파일 — PostgreSQL 전환 후 비어 있습니다.
 * 스키마 변경은 lib/db/src/schema/index.ts 에서 정의하고,
 * `pnpm --filter @workspace/db run push` (개발) 또는
 * Replit Publish 흐름 (프로덕션) 을 통해 자동 반영됩니다.
 */
export function runMigrations(): void {
  // no-op: schema is managed by drizzle-kit / Replit Publish
}
