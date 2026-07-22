#!/usr/bin/env node
/**
 * SQLite → PostgreSQL 1회성 데이터 이전 스크립트
 *
 * 실행 방법 (워크스페이스 루트에서):
 *   cd artifacts/api-server && node scripts/migrate-sqlite-to-pg.mjs
 *
 * 특성:
 * - employees 테이블에 데이터가 이미 있으면 전체 이전을 건너뜁니다 (중복 방지).
 * - 외래 키 순서(employees → child tables)를 지켜 삽입합니다.
 * - DROP, DELETE, TRUNCATE 를 사용하지 않습니다.
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── SQLite 연결 ──────────────────────────────────────────────────────────────
const DB_PATH =
  process.env.DB_PATH ||
  path.join(__dirname, "..", "..", "..", "data", "hr.db");

if (!fs.existsSync(DB_PATH)) {
  console.error(`SQLite DB not found: ${DB_PATH}`);
  process.exit(1);
}

const Database = require("better-sqlite3");
const sqlite = new Database(DB_PATH, { readonly: true });

// ── PostgreSQL 연결 ──────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function query(sql, params = []) {
  return pool.query(sql, params);
}

// ── 이미 데이터가 있으면 중단 ────────────────────────────────────────────────
async function checkPgEmpty() {
  const res = await query("SELECT COUNT(*) AS c FROM employees");
  return Number(res.rows[0].c) === 0;
}

// ── 행 삽입 헬퍼 ─────────────────────────────────────────────────────────────
async function insertMany(table, rows, buildParams) {
  for (const row of rows) {
    const { sql, params } = buildParams(row);
    await query(sql, params);
  }
  console.log(`  ✓ ${table}: ${rows.length}개 삽입`);
}

async function main() {
  console.log("═══ SQLite → PostgreSQL 데이터 이전 시작 ═══");
  console.log(`SQLite: ${DB_PATH}`);
  console.log(`PostgreSQL: ${process.env.DATABASE_URL.replace(/:\/\/.*@/, "://***@")}`);

  const isEmpty = await checkPgEmpty();
  if (!isEmpty) {
    console.log("\n⚠ PostgreSQL employees 테이블에 이미 데이터가 있습니다.");
    console.log("  이전이 완료된 것으로 간주하고 종료합니다.");
    console.log("  강제 재실행이 필요하면 PostgreSQL 데이터를 먼저 정리한 뒤 다시 실행하세요.");
    await pool.end();
    return;
  }

  // ── employees ──────────────────────────────────────────────────────────────
  const employees = sqlite.prepare("SELECT * FROM employees ORDER BY id").all();
  // id 매핑: SQLite id → PostgreSQL id (SERIAL 사용 시 다를 수 있음)
  const idMap = {};

  for (const e of employees) {
    const res = await query(
      `INSERT INTO employees
         (employee_number, name, department, position, hire_date, phone, email,
          address, birth_date, is_foreigner, nationality, visa_type,
          visa_expiry_date, passport_expiry_date, alien_registration_expiry_date,
          notes, status, status_changed_at, status_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (employee_number) DO NOTHING
       RETURNING id`,
      [
        e.employee_number, e.name, e.department, e.position, e.hire_date,
        e.phone, e.email, e.address, e.birth_date,
        Boolean(e.is_foreigner), e.nationality, e.visa_type,
        e.visa_expiry_date, e.passport_expiry_date, e.alien_registration_expiry_date,
        e.notes, e.status ?? "재직", e.status_changed_at, e.status_note,
      ]
    );
    if (res.rows.length > 0) {
      idMap[e.id] = res.rows[0].id;
    }
  }
  console.log(`  ✓ employees: ${Object.keys(idMap).length}개 삽입`);

  // ── personnel_history ──────────────────────────────────────────────────────
  const history = sqlite.prepare("SELECT * FROM personnel_history ORDER BY id").all();
  await insertMany("personnel_history", history.filter(r => idMap[r.employee_id]), (r) => ({
    sql: `INSERT INTO personnel_history
            (employee_id, type, date, description, previous_department, new_department, previous_position, new_position)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    params: [idMap[r.employee_id], r.type, r.date, r.description, r.previous_department, r.new_department, r.previous_position, r.new_position],
  }));

  // ── education ──────────────────────────────────────────────────────────────
  const education = sqlite.prepare("SELECT * FROM education ORDER BY id").all();
  await insertMany("education", education.filter(r => idMap[r.employee_id]), (r) => ({
    sql: `INSERT INTO education (employee_id, name, date, completed, certificate_file, notes)
          VALUES ($1,$2,$3,$4,$5,$6)`,
    params: [idMap[r.employee_id], r.name, r.date, Boolean(r.completed), r.certificate_file, r.notes],
  }));

  // ── rewards ────────────────────────────────────────────────────────────────
  const rewards = sqlite.prepare("SELECT * FROM rewards ORDER BY id").all();
  await insertMany("rewards", rewards.filter(r => idMap[r.employee_id]), (r) => ({
    sql: `INSERT INTO rewards (employee_id, type, date, content) VALUES ($1,$2,$3,$4)`,
    params: [idMap[r.employee_id], r.type, r.date, r.content],
  }));

  // ── disciplinary ───────────────────────────────────────────────────────────
  const disciplinary = sqlite.prepare("SELECT * FROM disciplinary ORDER BY id").all();
  await insertMany("disciplinary", disciplinary.filter(r => idMap[r.employee_id]), (r) => ({
    sql: `INSERT INTO disciplinary (employee_id, disciplinary_type, date, content) VALUES ($1,$2,$3,$4)`,
    params: [idMap[r.employee_id], r.disciplinary_type, r.date, r.content],
  }));

  // ── interviews ─────────────────────────────────────────────────────────────
  const interviews = sqlite.prepare("SELECT * FROM interviews ORDER BY id").all();
  await insertMany("interviews", interviews.filter(r => idMap[r.employee_id]), (r) => ({
    sql: `INSERT INTO interviews (employee_id, date, content, interviewer) VALUES ($1,$2,$3,$4)`,
    params: [idMap[r.employee_id], r.date, r.content, r.interviewer],
  }));

  // ── foreigner_info ─────────────────────────────────────────────────────────
  const foreigners = sqlite.prepare("SELECT * FROM foreigner_info ORDER BY id").all();
  await insertMany("foreigner_info", foreigners.filter(r => idMap[r.employee_id]), (r) => ({
    sql: `INSERT INTO foreigner_info
            (employee_id, visa_type, visa_expiry_date, passport_expiry_date, alien_registration_expiry_date, notes)
          VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT (employee_id) DO NOTHING`,
    params: [idMap[r.employee_id], r.visa_type, r.visa_expiry_date, r.passport_expiry_date, r.alien_registration_expiry_date, r.notes],
  }));

  // ── attachments ────────────────────────────────────────────────────────────
  const attachments = sqlite.prepare("SELECT * FROM attachments ORDER BY id").all();
  await insertMany("attachments", attachments.filter(r => idMap[r.employee_id]), (r) => ({
    sql: `INSERT INTO attachments (employee_id, category, file_name, file_url, file_size) VALUES ($1,$2,$3,$4,$5)`,
    params: [idMap[r.employee_id], r.category, r.file_name, r.file_url, r.file_size],
  }));

  // ── iso_schedules ──────────────────────────────────────────────────────────
  const iso = sqlite.prepare("SELECT * FROM iso_schedules ORDER BY id").all();
  await insertMany("iso_schedules", iso, (r) => ({
    sql: `INSERT INTO iso_schedules (title, scheduled_date, type, description) VALUES ($1,$2,$3,$4)`,
    params: [r.title, r.scheduled_date, r.type, r.description],
  }));

  // ── insurance_schedules ────────────────────────────────────────────────────
  const insurance = sqlite.prepare("SELECT * FROM insurance_schedules ORDER BY id").all();
  await insertMany("insurance_schedules", insurance, (r) => ({
    sql: `INSERT INTO insurance_schedules (insurance_name, renewal_date, insurer, amount, notes) VALUES ($1,$2,$3,$4,$5)`,
    params: [r.insurance_name, r.renewal_date, r.insurer, r.amount, r.notes],
  }));

  // ── documents ──────────────────────────────────────────────────────────────
  const documents = sqlite.prepare("SELECT * FROM documents ORDER BY id").all();
  await insertMany("documents", documents, (r) => ({
    sql: `INSERT INTO documents (title, category, employee_id, file_name, file_url, file_size) VALUES ($1,$2,$3,$4,$5,$6)`,
    params: [r.title, r.category, r.employee_id ? idMap[r.employee_id] : null, r.file_name, r.file_url, r.file_size],
  }));

  console.log("\n═══ 이전 완료 ═══");
  sqlite.close();
  await pool.end();
}

main().catch((err) => {
  console.error("이전 실패:", err);
  process.exit(1);
});
