// PostgreSQL Drizzle 인스턴스와 모든 테이블 스키마를 @workspace/db에서 재수출합니다.
// SQLite(better-sqlite3) 연결은 완전히 제거되었습니다.
export { db, pool } from "@workspace/db";
export {
  employeesTable,
  personnelHistoryTable,
  educationTable,
  rewardsTable,
  disciplinaryTable,
  interviewsTable,
  foreignerInfoTable,
  attachmentsTable,
  isoSchedulesTable,
  insuranceSchedulesTable,
  documentsTable,
} from "@workspace/db";
