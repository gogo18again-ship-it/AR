import { db } from "./db";
import { logger } from "./logger";

/** 기존 DB에 누락된 컬럼을 안전하게 추가하는 마이그레이션 */
export function runMigrations(): void {
  const cols = db.pragma("table_info(employees)") as Array<{ name: string }>;
  const colNames = new Set(cols.map((c) => c.name));

  if (!colNames.has("status")) {
    db.exec("ALTER TABLE employees ADD COLUMN status TEXT NOT NULL DEFAULT '재직'");
    logger.info("Migration: added 'status' column to employees");
  }
  if (!colNames.has("status_changed_at")) {
    db.exec("ALTER TABLE employees ADD COLUMN status_changed_at TEXT");
    logger.info("Migration: added 'status_changed_at' column to employees");
  }
  if (!colNames.has("status_note")) {
    db.exec("ALTER TABLE employees ADD COLUMN status_note TEXT");
    logger.info("Migration: added 'status_note' column to employees");
  }
}
