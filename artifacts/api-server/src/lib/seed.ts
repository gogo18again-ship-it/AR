/**
 * 개발 환경 전용 초기 데이터 삽입.
 * employees 테이블이 비어 있을 때만 실행됩니다 (중복 삽입 방지).
 * NODE_ENV=production 에서는 절대 실행하지 않습니다.
 */
import { db } from "./db";
import {
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
} from "./db";
import { count } from "drizzle-orm";
import { logger } from "./logger";

export async function seedIfEmpty(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const [{ c }] = await db.select({ c: count() }).from(employeesTable);
  if (Number(c) > 0) return;

  logger.info("Seeding initial data (dev only)...");

  // ── employees ─────────────────────────────────────────────────────────────
  const [emp1, emp2, emp3, emp4, emp5] = await db
    .insert(employeesTable)
    .values([
      {
        employeeNumber: "EMP001",
        name: "김민준",
        department: "생산팀",
        position: "팀장",
        hireDate: "2020-03-02",
        phone: "010-1234-5678",
        email: "minjun.kim@myungji.com",
        address: "서울시 강서구 마곡동",
        birthDate: "1985-04-15",
        isForeigner: false,
        notes: "우수 직원 표창 수상",
      },
      {
        employeeNumber: "EMP002",
        name: "이서연",
        department: "인사팀",
        position: "대리",
        hireDate: "2022-01-10",
        phone: "010-2345-6789",
        email: "seoyeon.lee@myungji.com",
        address: "서울시 마포구 상암동",
        birthDate: "1993-07-22",
        isForeigner: false,
      },
      {
        employeeNumber: "EMP003",
        name: "Nguyen Van An",
        department: "생산팀",
        position: "사원",
        hireDate: "2023-05-15",
        phone: "010-3456-7890",
        email: "vanan@myungji.com",
        address: "경기도 시흥시",
        birthDate: "1995-03-10",
        isForeigner: true,
        nationality: "베트남",
        visaType: "E-9",
        visaExpiryDate: "2025-09-15",
        passportExpiryDate: "2027-03-10",
        alienRegistrationExpiryDate: "2025-09-15",
        notes: "성실 근무",
      },
      {
        employeeNumber: "EMP004",
        name: "박지훈",
        department: "품질팀",
        position: "과장",
        hireDate: "2019-07-08",
        phone: "010-4567-8901",
        email: "jihoon.park@myungji.com",
        address: "경기도 부천시",
        birthDate: "1988-11-30",
        isForeigner: false,
      },
      {
        employeeNumber: "EMP005",
        name: "Zhang Wei",
        department: "생산팀",
        position: "사원",
        hireDate: "2024-02-01",
        phone: "010-5678-9012",
        email: "zhangwei@myungji.com",
        address: "인천시 남동구",
        birthDate: "1998-06-05",
        isForeigner: true,
        nationality: "중국",
        visaType: "E-7",
        visaExpiryDate: "2026-01-31",
        passportExpiryDate: "2028-06-05",
        alienRegistrationExpiryDate: "2026-01-31",
      },
    ])
    .returning({ id: employeesTable.id });

  const e1 = emp1.id, e2 = emp2.id, e3 = emp3.id, e4 = emp4.id, e5 = emp5.id;

  // ── personnel_history ─────────────────────────────────────────────────────
  await db.insert(personnelHistoryTable).values([
    { employeeId: e1, type: "입사", date: "2020-03-02", description: "생산팀 입사", newDepartment: "생산팀", newPosition: "사원" },
    { employeeId: e1, type: "승진", date: "2022-01-01", description: "대리 승진", previousPosition: "사원", newPosition: "대리" },
    { employeeId: e1, type: "승진", date: "2024-01-01", description: "팀장 승진", previousPosition: "대리", newPosition: "팀장" },
    { employeeId: e2, type: "입사", date: "2022-01-10", description: "인사팀 입사", newDepartment: "인사팀", newPosition: "사원" },
    { employeeId: e2, type: "승진", date: "2024-01-01", description: "대리 승진", previousPosition: "사원", newPosition: "대리" },
    { employeeId: e3, type: "입사", date: "2023-05-15", description: "생산팀 입사 (E-9 비자)", newDepartment: "생산팀", newPosition: "사원" },
    { employeeId: e4, type: "입사", date: "2019-07-08", description: "품질팀 입사", newDepartment: "품질팀", newPosition: "사원" },
    { employeeId: e4, type: "승진", date: "2021-01-01", description: "대리 승진", previousPosition: "사원", newPosition: "대리" },
    { employeeId: e4, type: "승진", date: "2023-07-01", description: "과장 승진", previousPosition: "대리", newPosition: "과장" },
    { employeeId: e5, type: "입사", date: "2024-02-01", description: "생산팀 입사 (E-7 비자)", newDepartment: "생산팀", newPosition: "사원" },
  ]);

  // ── education ─────────────────────────────────────────────────────────────
  await db.insert(educationTable).values([
    { employeeId: e1, name: "산업안전보건교육", date: "2023-06-15", completed: true, notes: "연간 의무 안전교육 이수" },
    { employeeId: e1, name: "리더십 역량 강화 과정", date: "2024-03-20", completed: true, notes: "팀장 대상 외부 교육" },
    { employeeId: e2, name: "인사노무 실무 교육", date: "2023-09-05", completed: true, notes: "HR 전문성 향상" },
    { employeeId: e3, name: "산업안전보건교육", date: "2023-07-10", completed: true, notes: "외국인 근로자 안전교육" },
    { employeeId: e3, name: "한국어 교육", date: "2023-08-01", completed: true, notes: "기초 한국어 수료" },
    { employeeId: e4, name: "ISO 9001 내부심사원 교육", date: "2023-10-12", completed: true, notes: "품질경영시스템 심사원 자격 취득" },
    { employeeId: e4, name: "산업안전보건교육", date: "2025-08-20", completed: false, notes: "예정된 안전교육" },
    { employeeId: e5, name: "산업안전보건교육", date: "2024-05-10", completed: true, notes: "신규 입사자 안전교육" },
  ]);

  // ── rewards ───────────────────────────────────────────────────────────────
  await db.insert(rewardsTable).values([
    { employeeId: e1, type: "포상", date: "2025-10-01", content: "2025년 우수 직원 표창 - 생산성 향상 기여" },
    { employeeId: e4, type: "포상", date: "2024-12-20", content: "ISO 심사 통과 기여 공로 포상" },
  ]);

  // ── disciplinary ──────────────────────────────────────────────────────────
  await db.insert(disciplinaryTable).values([
    { employeeId: e3, disciplinaryType: "주의", date: "2023-11-05", content: "작업장 안전수칙 미준수 - 구두 주의" },
  ]);

  // ── interviews ────────────────────────────────────────────────────────────
  await db.insert(interviewsTable).values([
    { employeeId: e1, date: "2025-03-20", content: "팀장 역할 적응 상태 확인. 팀원 관리 애로사항 청취. 리더십 지원 필요.", interviewer: "인사팀장" },
    { employeeId: e2, date: "2024-11-15", content: "업무 만족도 조사 면담. 현재 업무 만족도 양호.", interviewer: "인사팀장" },
    { employeeId: e3, date: "2024-01-10", content: "생활 적응 여부 및 건강 상태 확인 면담. 비자 갱신 안내.", interviewer: "인사담당" },
    { employeeId: e5, date: "2024-06-15", content: "입사 후 4개월 적응 면담. 업무 이해도 양호.", interviewer: "인사담당" },
  ]);

  // ── foreigner_info ────────────────────────────────────────────────────────
  await db.insert(foreignerInfoTable).values([
    { employeeId: e3, visaType: "E-9", visaExpiryDate: "2025-09-15", passportExpiryDate: "2027-03-10", alienRegistrationExpiryDate: "2025-09-15", notes: "비자 만료 90일 전 갱신 신청 필요" },
    { employeeId: e5, visaType: "E-7", visaExpiryDate: "2026-01-31", passportExpiryDate: "2028-06-05", alienRegistrationExpiryDate: "2026-01-31", notes: "E-7 전문인력 비자" },
  ]);

  // ── attachments ───────────────────────────────────────────────────────────
  await db.insert(attachmentsTable).values([
    { employeeId: e1, category: "근로계약서", fileName: "EMP001_근로계약서_2020.pdf", fileUrl: "/files/contracts/EMP001_contract_2020.pdf", fileSize: 245760 },
    { employeeId: e1, category: "근로계약서", fileName: "EMP001_근로계약서_갱신_2023.pdf", fileUrl: "/files/contracts/EMP001_contract_2023.pdf", fileSize: 256000 },
    { employeeId: e2, category: "근로계약서", fileName: "EMP002_근로계약서_2022.pdf", fileUrl: "/files/contracts/EMP002_contract_2022.pdf", fileSize: 240640 },
    { employeeId: e3, category: "근로계약서", fileName: "EMP003_근로계약서_2023.pdf", fileUrl: "/files/contracts/EMP003_contract_2023.pdf", fileSize: 262144 },
    { employeeId: e3, category: "기타", fileName: "EMP003_외국인등록증_사본.pdf", fileUrl: "/files/misc/EMP003_alien_card.pdf", fileSize: 102400 },
    { employeeId: e4, category: "교육수료증", fileName: "EMP004_ISO9001내부심사원_수료증.pdf", fileUrl: "/files/cert/EMP004_iso9001.pdf", fileSize: 153600 },
    { employeeId: e4, category: "자격증", fileName: "EMP004_품질관리기사.pdf", fileUrl: "/files/cert/EMP004_quality.pdf", fileSize: 204800 },
    { employeeId: e5, category: "근로계약서", fileName: "EMP005_근로계약서_2024.pdf", fileUrl: "/files/contracts/EMP005_contract_2024.pdf", fileSize: 258048 },
  ]);

  // ── iso_schedules ─────────────────────────────────────────────────────────
  await db.insert(isoSchedulesTable).values([
    { title: "ISO 9001 정기 내부심사", scheduledDate: "2025-09-10", type: "내부심사", description: "품질경영시스템 정기 내부심사" },
    { title: "ISO 14001 갱신심사", scheduledDate: "2025-11-20", type: "갱신심사", description: "환경경영시스템 3년 주기 갱신심사" },
    { title: "ISO 45001 사전 검토", scheduledDate: "2025-08-05", type: "사전검토", description: "안전보건경영시스템 심사 사전 문서 검토" },
  ]);

  // ── insurance_schedules ───────────────────────────────────────────────────
  await db.insert(insuranceSchedulesTable).values([
    { insuranceName: "단체상해보험", renewalDate: "2025-08-31", insurer: "삼성화재", amount: 3600000, notes: "전 직원 대상 단체상해보험 연간 갱신" },
    { insuranceName: "배상책임보험", renewalDate: "2025-10-15", insurer: "현대해상", amount: 1800000, notes: "사업장 배상책임보험" },
    { insuranceName: "화재보험", renewalDate: "2026-01-20", insurer: "DB손보", amount: 2400000, notes: "공장 및 창고 화재보험" },
  ]);

  // ── documents ─────────────────────────────────────────────────────────────
  await db.insert(documentsTable).values([
    { title: "2025 ISO 9001 내부심사 계획서", category: "ISO", fileName: "2025_ISO9001_audit_plan.pdf", fileUrl: "/files/iso/2025_audit_plan.pdf", fileSize: 512000 },
    { title: "ESG 경영 방침", category: "ESG", fileName: "ESG_policy_2025.pdf", fileUrl: "/files/esg/ESG_policy_2025.pdf", fileSize: 1024000 },
    { title: "산업안전보건법 교육자료 2024", category: "교육자료", fileName: "safety_edu_2024.pdf", fileUrl: "/files/edu/safety_2024.pdf", fileSize: 2048000 },
    { title: "EMP001 근로계약서", category: "근로계약서", employeeId: e1, fileName: "EMP001_contract.pdf", fileUrl: "/files/contracts/EMP001_contract_2020.pdf", fileSize: 245760 },
    { title: "EMP003 징계 처리 확인서", category: "징계문서", employeeId: e3, fileName: "EMP003_disciplinary.pdf", fileUrl: "/files/disc/EMP003_2023.pdf", fileSize: 102400 },
  ]);

  logger.info("Seed data inserted successfully");
}
