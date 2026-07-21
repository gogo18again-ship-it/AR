import Database from "better-sqlite3";
import path from "path";
import { logger } from "./logger";

const DB_PATH = process.env["DB_PATH"] || path.join(process.cwd(), "data", "hr.db");

// Ensure the data directory exists
import fs from "fs";
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

logger.info({ dbPath: DB_PATH }, "SQLite database initialized");

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      position TEXT NOT NULL,
      hire_date TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      birth_date TEXT,
      is_foreigner INTEGER NOT NULL DEFAULT 0,
      nationality TEXT,
      visa_type TEXT,
      visa_expiry_date TEXT,
      passport_expiry_date TEXT,
      alien_registration_expiry_date TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT '재직',
      status_changed_at TEXT,
      status_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS personnel_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      previous_department TEXT,
      new_department TEXT,
      previous_position TEXT,
      new_position TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      certificate_file TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS disciplinary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      disciplinary_type TEXT NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      interviewer TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS foreigner_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
      visa_type TEXT NOT NULL,
      visa_expiry_date TEXT NOT NULL,
      passport_expiry_date TEXT NOT NULL,
      alien_registration_expiry_date TEXT NOT NULL,
      notes TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS iso_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS insurance_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insurance_name TEXT NOT NULL,
      renewal_date TEXT NOT NULL,
      insurer TEXT,
      amount INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  logger.info("Database schema initialized");
  seedData();
}

function seedData(): void {
  const count = (db.prepare("SELECT COUNT(*) as c FROM employees").get() as { c: number }).c;
  if (count > 0) return;

  logger.info("Seeding initial data...");

  // Insert 5 employees
  const insertEmployee = db.prepare(`
    INSERT INTO employees (employee_number, name, department, position, hire_date, phone, email, address, birth_date, is_foreigner, nationality, visa_type, visa_expiry_date, passport_expiry_date, alien_registration_expiry_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const emp1 = insertEmployee.run("EMP001", "김민준", "생산팀", "팀장", "2020-03-02", "010-1234-5678", "minjun.kim@myungji.com", "서울시 강서구 마곡동", "1985-04-15", 0, null, null, null, null, null, "우수 직원 표창 수상");
  const emp2 = insertEmployee.run("EMP002", "이서연", "인사팀", "대리", "2022-01-10", "010-2345-6789", "seoyeon.lee@myungji.com", "서울시 마포구 상암동", "1993-07-22", 0, null, null, null, null, null, null);
  const emp3 = insertEmployee.run("EMP003", "Nguyen Van An", "생산팀", "사원", "2023-05-15", "010-3456-7890", "vanan@myungji.com", "경기도 시흥시", "1995-03-10", 1, "베트남", "E-9", "2025-09-15", "2027-03-10", "2025-09-15", "성실 근무");
  const emp4 = insertEmployee.run("EMP004", "박지훈", "품질팀", "과장", "2019-07-08", "010-4567-8901", "jihoon.park@myungji.com", "경기도 부천시", "1988-11-30", 0, null, null, null, null, null, null);
  const emp5 = insertEmployee.run("EMP005", "Zhang Wei", "생산팀", "사원", "2024-02-01", "010-5678-9012", "zhangwei@myungji.com", "인천시 남동구", "1998-06-05", 1, "중국", "E-7", "2026-01-31", "2028-06-05", "2026-01-31", null);

  const emp1Id = emp1.lastInsertRowid as number;
  const emp2Id = emp2.lastInsertRowid as number;
  const emp3Id = emp3.lastInsertRowid as number;
  const emp4Id = emp4.lastInsertRowid as number;
  const emp5Id = emp5.lastInsertRowid as number;

  // Personnel history
  const insertHistory = db.prepare(`
    INSERT INTO personnel_history (employee_id, type, date, description, previous_department, new_department, previous_position, new_position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertHistory.run(emp1Id, "입사", "2020-03-02", "생산팀 입사", null, "생산팀", null, "사원");
  insertHistory.run(emp1Id, "승진", "2022-01-01", "대리 승진", null, null, "사원", "대리");
  insertHistory.run(emp1Id, "승진", "2024-01-01", "팀장 승진", null, null, "대리", "팀장");
  insertHistory.run(emp2Id, "입사", "2022-01-10", "인사팀 입사", null, "인사팀", null, "사원");
  insertHistory.run(emp2Id, "승진", "2024-01-01", "대리 승진", null, null, "사원", "대리");
  insertHistory.run(emp3Id, "입사", "2023-05-15", "생산팀 입사 (E-9 비자)", null, "생산팀", null, "사원");
  insertHistory.run(emp4Id, "입사", "2019-07-08", "품질팀 입사", null, "품질팀", null, "사원");
  insertHistory.run(emp4Id, "승진", "2021-01-01", "대리 승진", null, null, "사원", "대리");
  insertHistory.run(emp4Id, "승진", "2023-07-01", "과장 승진", null, null, "대리", "과장");
  insertHistory.run(emp5Id, "입사", "2024-02-01", "생산팀 입사 (E-7 비자)", null, "생산팀", null, "사원");

  // Education history
  const insertEducation = db.prepare(`
    INSERT INTO education (employee_id, name, date, completed, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertEducation.run(emp1Id, "산업안전보건교육", "2023-06-15", 1, "연간 의무 안전교육 이수");
  insertEducation.run(emp1Id, "리더십 역량 강화 과정", "2024-03-20", 1, "팀장 대상 외부 교육");
  insertEducation.run(emp2Id, "인사노무 실무 교육", "2023-09-05", 1, "HR 전문성 향상");
  insertEducation.run(emp3Id, "산업안전보건교육", "2023-07-10", 1, "외국인 근로자 안전교육");
  insertEducation.run(emp3Id, "한국어 교육", "2023-08-01", 1, "기초 한국어 수료");
  insertEducation.run(emp4Id, "ISO 9001 내부심사원 교육", "2023-10-12", 1, "품질경영시스템 심사원 자격 취득");
  insertEducation.run(emp4Id, "산업안전보건교육", "2025-08-20", 0, "예정된 안전교육");
  insertEducation.run(emp5Id, "산업안전보건교육", "2024-05-10", 1, "신규 입사자 안전교육");

  // Rewards
  const insertReward = db.prepare(`
    INSERT INTO rewards (employee_id, type, date, content)
    VALUES (?, ?, ?, ?)
  `);
  insertReward.run(emp1Id, "포상", "2025-10-01", "2025년 우수 직원 표창 - 생산성 향상 기여");
  insertReward.run(emp4Id, "포상", "2024-12-20", "ISO 심사 통과 기여 공로 포상");

  // Disciplinary
  const insertDisciplinary = db.prepare(`
    INSERT INTO disciplinary (employee_id, disciplinary_type, date, content)
    VALUES (?, ?, ?, ?)
  `);
  insertDisciplinary.run(emp3Id, "주의", "2023-11-05", "작업장 안전수칙 미준수 - 구두 주의");

  // Interviews
  const insertInterview = db.prepare(`
    INSERT INTO interviews (employee_id, date, content, interviewer)
    VALUES (?, ?, ?, ?)
  `);
  insertInterview.run(emp1Id, "2025-03-20", "팀장 역할 적응 상태 확인. 팀원 관리 애로사항 청취. 리더십 지원 필요.", "인사팀장");
  insertInterview.run(emp2Id, "2024-11-15", "업무 만족도 조사 면담. 현재 업무 만족도 양호.", "인사팀장");
  insertInterview.run(emp3Id, "2024-01-10", "생활 적응 여부 및 건강 상태 확인 면담. 비자 갱신 안내.", "인사담당");
  insertInterview.run(emp5Id, "2024-06-15", "입사 후 4개월 적응 면담. 업무 이해도 양호.", "인사담당");

  // Foreigner info
  const insertForeignerInfo = db.prepare(`
    INSERT INTO foreigner_info (employee_id, visa_type, visa_expiry_date, passport_expiry_date, alien_registration_expiry_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertForeignerInfo.run(emp3Id, "E-9", "2025-09-15", "2027-03-10", "2025-09-15", "비자 만료 90일 전 갱신 신청 필요");
  insertForeignerInfo.run(emp5Id, "E-7", "2026-01-31", "2028-06-05", "2026-01-31", "E-7 전문인력 비자");

  // Attachments
  const insertAttachment = db.prepare(`
    INSERT INTO attachments (employee_id, category, file_name, file_url, file_size)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAttachment.run(emp1Id, "근로계약서", "EMP001_근로계약서_2020.pdf", "/files/contracts/EMP001_contract_2020.pdf", 245760);
  insertAttachment.run(emp1Id, "근로계약서", "EMP001_근로계약서_갱신_2023.pdf", "/files/contracts/EMP001_contract_2023.pdf", 256000);
  insertAttachment.run(emp2Id, "근로계약서", "EMP002_근로계약서_2022.pdf", "/files/contracts/EMP002_contract_2022.pdf", 240640);
  insertAttachment.run(emp3Id, "근로계약서", "EMP003_근로계약서_2023.pdf", "/files/contracts/EMP003_contract_2023.pdf", 262144);
  insertAttachment.run(emp3Id, "기타", "EMP003_외국인등록증_사본.pdf", "/files/misc/EMP003_alien_card.pdf", 102400);
  insertAttachment.run(emp4Id, "교육수료증", "EMP004_ISO9001내부심사원_수료증.pdf", "/files/cert/EMP004_iso9001.pdf", 153600);
  insertAttachment.run(emp4Id, "자격증", "EMP004_품질관리기사.pdf", "/files/cert/EMP004_quality.pdf", 204800);
  insertAttachment.run(emp5Id, "근로계약서", "EMP005_근로계약서_2024.pdf", "/files/contracts/EMP005_contract_2024.pdf", 258048);

  // ISO schedules
  const insertIso = db.prepare(`
    INSERT INTO iso_schedules (title, scheduled_date, type, description)
    VALUES (?, ?, ?, ?)
  `);
  insertIso.run("ISO 9001 정기 내부심사", "2025-09-10", "내부심사", "품질경영시스템 정기 내부심사");
  insertIso.run("ISO 14001 갱신심사", "2025-11-20", "갱신심사", "환경경영시스템 3년 주기 갱신심사");
  insertIso.run("ISO 45001 사전 검토", "2025-08-05", "사전검토", "안전보건경영시스템 심사 사전 문서 검토");

  // Insurance schedules
  const insertInsurance = db.prepare(`
    INSERT INTO insurance_schedules (insurance_name, renewal_date, insurer, amount, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertInsurance.run("단체상해보험", "2025-08-31", "삼성화재", 3600000, "전 직원 대상 단체상해보험 연간 갱신");
  insertInsurance.run("배상책임보험", "2025-10-15", "현대해상", 1800000, "사업장 배상책임보험");
  insertInsurance.run("화재보험", "2026-01-20", "DB손보", 2400000, "공장 및 창고 화재보험");

  // Documents
  const insertDocument = db.prepare(`
    INSERT INTO documents (title, category, employee_id, file_name, file_url, file_size)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertDocument.run("2025 ISO 9001 내부심사 계획서", "ISO", null, "2025_ISO9001_audit_plan.pdf", "/files/iso/2025_audit_plan.pdf", 512000);
  insertDocument.run("ESG 경영 방침", "ESG", null, "ESG_policy_2025.pdf", "/files/esg/ESG_policy_2025.pdf", 1024000);
  insertDocument.run("산업안전보건법 교육자료 2024", "교육자료", null, "safety_edu_2024.pdf", "/files/edu/safety_2024.pdf", 2048000);
  insertDocument.run("EMP001 근로계약서", "근로계약서", emp1Id, "EMP001_contract.pdf", "/files/contracts/EMP001_contract_2020.pdf", 245760);
  insertDocument.run("EMP003 징계 처리 확인서", "징계문서", emp3Id, "EMP003_disciplinary.pdf", "/files/disc/EMP003_2023.pdf", 102400);

  logger.info("Seed data inserted successfully");
}
