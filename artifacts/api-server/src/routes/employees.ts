import { Router } from "express";
import { and, asc, desc, eq, like } from "drizzle-orm";
import {
  db,
  employeesTable,
  personnelHistoryTable,
  educationTable,
  rewardsTable,
  disciplinaryTable,
  interviewsTable,
  foreignerInfoTable,
  attachmentsTable,
} from "../lib/db";

const router = Router();

type EmployeeRow = typeof employeesTable.$inferSelect;
type HistoryRow = typeof personnelHistoryTable.$inferSelect;
type EducationRow = typeof educationTable.$inferSelect;
type RewardRow = typeof rewardsTable.$inferSelect;
type DisciplinaryRow = typeof disciplinaryTable.$inferSelect;
type InterviewRow = typeof interviewsTable.$inferSelect;
type ForeignerRow = typeof foreignerInfoTable.$inferSelect;
type AttachmentRow = typeof attachmentsTable.$inferSelect;

function toEmployee(row: EmployeeRow) {
  return {
    id: row.id,
    employeeNumber: row.employeeNumber,
    name: row.name,
    department: row.department,
    position: row.position,
    hireDate: row.hireDate,
    phone: row.phone ?? null,
    isForeigner: row.isForeigner,
    visaType: row.visaType ?? null,
    visaExpiryDate: row.visaExpiryDate ?? null,
    status: row.status ?? "재직",
    statusChangedAt: row.statusChangedAt ?? null,
    statusNote: row.statusNote ?? null,
    createdAt: row.createdAt,
  };
}

function toEmployeeDetail(row: EmployeeRow) {
  return {
    id: row.id,
    employeeNumber: row.employeeNumber,
    name: row.name,
    department: row.department,
    position: row.position,
    hireDate: row.hireDate,
    phone: row.phone ?? null,
    email: row.email ?? null,
    address: row.address ?? null,
    birthDate: row.birthDate ?? null,
    isForeigner: row.isForeigner,
    nationality: row.nationality ?? null,
    visaType: row.visaType ?? null,
    visaExpiryDate: row.visaExpiryDate ?? null,
    passportExpiryDate: row.passportExpiryDate ?? null,
    alienRegistrationExpiryDate: row.alienRegistrationExpiryDate ?? null,
    notes: row.notes ?? null,
    status: row.status ?? "재직",
    statusChangedAt: row.statusChangedAt ?? null,
    statusNote: row.statusNote ?? null,
    createdAt: row.createdAt,
  };
}

function toHistory(r: HistoryRow) {
  return {
    id: r.id, employeeId: r.employeeId, type: r.type, date: r.date,
    description: r.description, previousDepartment: r.previousDepartment ?? null,
    newDepartment: r.newDepartment ?? null, previousPosition: r.previousPosition ?? null,
    newPosition: r.newPosition ?? null, createdAt: r.createdAt,
  };
}

function toEducation(r: EducationRow) {
  return {
    id: r.id, employeeId: r.employeeId, name: r.name, date: r.date,
    completed: r.completed, certificateFile: r.certificateFile ?? null,
    notes: r.notes ?? null, createdAt: r.createdAt,
  };
}

function toReward(r: RewardRow) {
  return { id: r.id, employeeId: r.employeeId, type: r.type, date: r.date, content: r.content, createdAt: r.createdAt };
}

function toDisciplinary(r: DisciplinaryRow) {
  return { id: r.id, employeeId: r.employeeId, disciplinaryType: r.disciplinaryType, date: r.date, content: r.content, createdAt: r.createdAt };
}

function toInterview(r: InterviewRow) {
  return { id: r.id, employeeId: r.employeeId, date: r.date, content: r.content, interviewer: r.interviewer ?? null, createdAt: r.createdAt };
}

function toForeignerInfo(r: ForeignerRow) {
  return { id: r.id, employeeId: r.employeeId, visaType: r.visaType, visaExpiryDate: r.visaExpiryDate, passportExpiryDate: r.passportExpiryDate, alienRegistrationExpiryDate: r.alienRegistrationExpiryDate, notes: r.notes ?? null, updatedAt: r.updatedAt };
}

function toAttachment(r: AttachmentRow) {
  return { id: r.id, employeeId: r.employeeId, category: r.category, fileName: r.fileName, fileUrl: r.fileUrl, fileSize: r.fileSize ?? null, uploadedAt: r.uploadedAt };
}

function parseId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

// ─── Employees ───────────────────────────────────────────────────────────────

router.get("/employees", async (req, res): Promise<void> => {
  const { name, department, position, status } = req.query as Record<string, string | undefined>;
  const conditions = [];
  if (name) conditions.push(like(employeesTable.name, `%${name}%`));
  if (department) conditions.push(eq(employeesTable.department, department));
  if (position) conditions.push(eq(employeesTable.position, position));
  if (status) conditions.push(eq(employeesTable.status, status));

  const rows = await db.select().from(employeesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(employeesTable.createdAt));
  res.json(rows.map(toEmployee));
});

router.post("/employees", async (req, res): Promise<void> => {
  const b = req.body;
  const [row] = await db.insert(employeesTable).values({
    employeeNumber: b.employeeNumber,
    name: b.name,
    department: b.department,
    position: b.position,
    hireDate: b.hireDate,
    phone: b.phone ?? null,
    email: b.email ?? null,
    address: b.address ?? null,
    birthDate: b.birthDate ?? null,
    isForeigner: Boolean(b.isForeigner),
    nationality: b.nationality ?? null,
    visaType: b.visaType ?? null,
    visaExpiryDate: b.visaExpiryDate ?? null,
    passportExpiryDate: b.passportExpiryDate ?? null,
    alienRegistrationExpiryDate: b.alienRegistrationExpiryDate ?? null,
    notes: b.notes ?? null,
  }).returning();
  res.status(201).json(toEmployee(row));
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [row] = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
  if (!row) { res.status(404).json({ error: "직원을 찾을 수 없습니다." }); return; }
  res.json(toEmployeeDetail(row));
});

router.put("/employees/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const b = req.body;
  const [row] = await db.update(employeesTable).set({
    employeeNumber: b.employeeNumber,
    name: b.name,
    department: b.department,
    position: b.position,
    hireDate: b.hireDate,
    phone: b.phone ?? null,
    email: b.email ?? null,
    address: b.address ?? null,
    birthDate: b.birthDate ?? null,
    isForeigner: Boolean(b.isForeigner),
    nationality: b.nationality ?? null,
    visaType: b.visaType ?? null,
    visaExpiryDate: b.visaExpiryDate ?? null,
    passportExpiryDate: b.passportExpiryDate ?? null,
    alienRegistrationExpiryDate: b.alienRegistrationExpiryDate ?? null,
    notes: b.notes ?? null,
  }).where(eq(employeesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "직원을 찾을 수 없습니다." }); return; }
  res.json(toEmployee(row));
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  await db.delete(employeesTable).where(eq(employeesTable.id, id));
  res.status(204).end();
});

router.patch("/employees/:id/status", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { status, statusNote } = req.body as { status: string; statusNote?: string };

  const allowed = ["재직", "휴직", "퇴사"];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: "status는 재직 | 휴직 | 퇴사 중 하나여야 합니다." });
    return;
  }

  const [row] = await db.update(employeesTable).set({
    status,
    statusChangedAt: new Date().toISOString(),
    statusNote: statusNote ?? null,
  }).where(eq(employeesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "직원을 찾을 수 없습니다." }); return; }
  res.json(toEmployeeDetail(row));
});

// ─── Personnel History ───────────────────────────────────────────────────────

router.get("/employees/:id/personnel-history", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const rows = await db.select().from(personnelHistoryTable)
    .where(eq(personnelHistoryTable.employeeId, id))
    .orderBy(desc(personnelHistoryTable.date));
  res.json(rows.map(toHistory));
});

router.post("/employees/:id/personnel-history", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const b = req.body;
  const [row] = await db.insert(personnelHistoryTable).values({
    employeeId: id,
    type: b.type,
    date: b.date,
    description: b.description,
    previousDepartment: b.previousDepartment ?? null,
    newDepartment: b.newDepartment ?? null,
    previousPosition: b.previousPosition ?? null,
    newPosition: b.newPosition ?? null,
  }).returning();
  res.status(201).json(toHistory(row));
});

router.put("/personnel-history/:rid", async (req, res): Promise<void> => {
  const rid = parseId(req.params.rid);
  const b = req.body;
  const [row] = await db.update(personnelHistoryTable).set({
    type: b.type, date: b.date, description: b.description,
    previousDepartment: b.previousDepartment ?? null, newDepartment: b.newDepartment ?? null,
    previousPosition: b.previousPosition ?? null, newPosition: b.newPosition ?? null,
  }).where(eq(personnelHistoryTable.id, rid)).returning();
  res.json(toHistory(row));
});

router.delete("/personnel-history/:rid", async (req, res): Promise<void> => {
  const rid = parseId(req.params.rid);
  await db.delete(personnelHistoryTable).where(eq(personnelHistoryTable.id, rid));
  res.status(204).end();
});

// ─── Education ───────────────────────────────────────────────────────────────

router.get("/employees/:id/education", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const rows = await db.select().from(educationTable)
    .where(eq(educationTable.employeeId, id))
    .orderBy(desc(educationTable.date));
  res.json(rows.map(toEducation));
});

router.post("/employees/:id/education", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const b = req.body;
  const [row] = await db.insert(educationTable).values({
    employeeId: id, name: b.name, date: b.date,
    completed: Boolean(b.completed), certificateFile: b.certificateFile ?? null, notes: b.notes ?? null,
  }).returning();
  res.status(201).json(toEducation(row));
});

router.put("/education/:rid", async (req, res): Promise<void> => {
  const rid = parseId(req.params.rid);
  const b = req.body;
  const [row] = await db.update(educationTable).set({
    name: b.name, date: b.date, completed: Boolean(b.completed), notes: b.notes ?? null,
  }).where(eq(educationTable.id, rid)).returning();
  res.json(toEducation(row));
});

router.delete("/education/:rid", async (req, res): Promise<void> => {
  const rid = parseId(req.params.rid);
  await db.delete(educationTable).where(eq(educationTable.id, rid));
  res.status(204).end();
});

// ─── Rewards ─────────────────────────────────────────────────────────────────

router.get("/employees/:id/rewards", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const rows = await db.select().from(rewardsTable)
    .where(eq(rewardsTable.employeeId, id))
    .orderBy(desc(rewardsTable.date));
  res.json(rows.map(toReward));
});

router.post("/employees/:id/rewards", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const b = req.body;
  const [row] = await db.insert(rewardsTable).values({ employeeId: id, type: b.type, date: b.date, content: b.content }).returning();
  res.status(201).json(toReward(row));
});

router.put("/rewards/:rid", async (req, res): Promise<void> => {
  const rid = parseId(req.params.rid);
  const b = req.body;
  const [row] = await db.update(rewardsTable).set({ type: b.type, date: b.date, content: b.content }).where(eq(rewardsTable.id, rid)).returning();
  res.json(toReward(row));
});

router.delete("/rewards/:rid", async (req, res): Promise<void> => {
  const rid = parseId(req.params.rid);
  await db.delete(rewardsTable).where(eq(rewardsTable.id, rid));
  res.status(204).end();
});

// ─── Disciplinary ────────────────────────────────────────────────────────────

router.get("/employees/:id/disciplinary", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const rows = await db.select().from(disciplinaryTable)
    .where(eq(disciplinaryTable.employeeId, id))
    .orderBy(desc(disciplinaryTable.date));
  res.json(rows.map(toDisciplinary));
});

router.post("/employees/:id/disciplinary", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const b = req.body;
  const [row] = await db.insert(disciplinaryTable).values({ employeeId: id, disciplinaryType: b.disciplinaryType, date: b.date, content: b.content }).returning();
  res.status(201).json(toDisciplinary(row));
});

router.put("/disciplinary/:rid", async (req, res): Promise<void> => {
  const rid = parseId(req.params.rid);
  const b = req.body;
  const [row] = await db.update(disciplinaryTable).set({ disciplinaryType: b.disciplinaryType, date: b.date, content: b.content }).where(eq(disciplinaryTable.id, rid)).returning();
  res.json(toDisciplinary(row));
});

router.delete("/disciplinary/:rid", async (req, res): Promise<void> => {
  const rid = parseId(req.params.rid);
  await db.delete(disciplinaryTable).where(eq(disciplinaryTable.id, rid));
  res.status(204).end();
});

// ─── Interviews ───────────────────────────────────────────────────────────────

router.get("/employees/:id/interviews", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const rows = await db.select().from(interviewsTable)
    .where(eq(interviewsTable.employeeId, id))
    .orderBy(desc(interviewsTable.date));
  res.json(rows.map(toInterview));
});

router.post("/employees/:id/interviews", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const b = req.body;
  const [row] = await db.insert(interviewsTable).values({ employeeId: id, date: b.date, content: b.content, interviewer: b.interviewer ?? null }).returning();
  res.status(201).json(toInterview(row));
});

router.put("/interviews/:rid", async (req, res): Promise<void> => {
  const rid = parseId(req.params.rid);
  const b = req.body;
  const [row] = await db.update(interviewsTable).set({ date: b.date, content: b.content, interviewer: b.interviewer ?? null }).where(eq(interviewsTable.id, rid)).returning();
  res.json(toInterview(row));
});

router.delete("/interviews/:rid", async (req, res): Promise<void> => {
  const rid = parseId(req.params.rid);
  await db.delete(interviewsTable).where(eq(interviewsTable.id, rid));
  res.status(204).end();
});

// ─── Foreigner Info ───────────────────────────────────────────────────────────

router.get("/employees/:id/foreigner-info", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [row] = await db.select().from(foreignerInfoTable).where(eq(foreignerInfoTable.employeeId, id));
  if (!row) { res.status(404).json({ error: "외국인 정보가 없습니다." }); return; }
  res.json(toForeignerInfo(row));
});

router.put("/employees/:id/foreigner-info", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const b = req.body;
  await db.insert(foreignerInfoTable).values({
    employeeId: id,
    visaType: b.visaType,
    visaExpiryDate: b.visaExpiryDate,
    passportExpiryDate: b.passportExpiryDate,
    alienRegistrationExpiryDate: b.alienRegistrationExpiryDate,
    notes: b.notes ?? null,
  }).onConflictDoUpdate({
    target: foreignerInfoTable.employeeId,
    set: {
      visaType: b.visaType,
      visaExpiryDate: b.visaExpiryDate,
      passportExpiryDate: b.passportExpiryDate,
      alienRegistrationExpiryDate: b.alienRegistrationExpiryDate,
      notes: b.notes ?? null,
      updatedAt: new Date(),
    },
  });
  const [row] = await db.select().from(foreignerInfoTable).where(eq(foreignerInfoTable.employeeId, id));
  res.json(toForeignerInfo(row));
});

// ─── Attachments ─────────────────────────────────────────────────────────────

router.get("/employees/:id/attachments", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const rows = await db.select().from(attachmentsTable)
    .where(eq(attachmentsTable.employeeId, id))
    .orderBy(desc(attachmentsTable.uploadedAt));
  res.json(rows.map(toAttachment));
});

router.post("/employees/:id/attachments", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const b = req.body;
  const [row] = await db.insert(attachmentsTable).values({
    employeeId: id, category: b.category, fileName: b.fileName, fileUrl: b.fileUrl, fileSize: b.fileSize ?? null,
  }).returning();
  res.status(201).json(toAttachment(row));
});

router.delete("/attachments/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  await db.delete(attachmentsTable).where(eq(attachmentsTable.id, id));
  res.status(204).end();
});

// ─── Timeline ────────────────────────────────────────────────────────────────

router.get("/employees/:id/timeline", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);

  const [history, education, rewards, disciplinary, interviews] = await Promise.all([
    db.select().from(personnelHistoryTable).where(eq(personnelHistoryTable.employeeId, id)),
    db.select().from(educationTable).where(eq(educationTable.employeeId, id)),
    db.select().from(rewardsTable).where(eq(rewardsTable.employeeId, id)),
    db.select().from(disciplinaryTable).where(eq(disciplinaryTable.employeeId, id)),
    db.select().from(interviewsTable).where(eq(interviewsTable.employeeId, id)),
  ]);

  const events: { date: string; type: string; description: string; category: string }[] = [];

  for (const r of history) {
    events.push({ date: r.date, type: r.type, description: r.description, category: "인사이력" });
  }
  for (const r of education) {
    events.push({ date: r.date, type: "교육", description: `${r.name}${r.completed ? " (수료)" : " (예정)"}`, category: "교육이력" });
  }
  for (const r of rewards) {
    events.push({ date: r.date, type: r.type, description: r.content, category: "상벌이력" });
  }
  for (const r of disciplinary) {
    events.push({ date: r.date, type: "징계", description: `[${r.disciplinaryType}] ${r.content}`, category: "징계이력" });
  }
  for (const r of interviews) {
    events.push({ date: r.date, type: "면담", description: r.content, category: "면담기록" });
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  res.json(events);
});

export default router;
