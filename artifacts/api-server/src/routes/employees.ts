import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

function toEmployee(row: Record<string, unknown>) {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    name: row.name,
    department: row.department,
    position: row.position,
    hireDate: row.hire_date,
    phone: row.phone ?? null,
    isForeigner: row.is_foreigner === 1,
    visaType: row.visa_type ?? null,
    visaExpiryDate: row.visa_expiry_date ?? null,
    status: (row.status as string) ?? "재직",
    statusChangedAt: row.status_changed_at ?? null,
    statusNote: row.status_note ?? null,
    createdAt: row.created_at,
  };
}

function toEmployeeDetail(row: Record<string, unknown>) {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    name: row.name,
    department: row.department,
    position: row.position,
    hireDate: row.hire_date,
    phone: row.phone ?? null,
    email: row.email ?? null,
    address: row.address ?? null,
    birthDate: row.birth_date ?? null,
    isForeigner: row.is_foreigner === 1,
    nationality: row.nationality ?? null,
    visaType: row.visa_type ?? null,
    visaExpiryDate: row.visa_expiry_date ?? null,
    passportExpiryDate: row.passport_expiry_date ?? null,
    alienRegistrationExpiryDate: row.alien_registration_expiry_date ?? null,
    notes: row.notes ?? null,
    status: (row.status as string) ?? "재직",
    statusChangedAt: row.status_changed_at ?? null,
    statusNote: row.status_note ?? null,
    createdAt: row.created_at,
  };
}

// List employees
router.get("/employees", async (req, res): Promise<void> => {
  const { name, department, position, status } = req.query as Record<string, string | undefined>;
  let sql = "SELECT * FROM employees WHERE 1=1";
  const params: unknown[] = [];

  if (name) { sql += " AND name LIKE ?"; params.push(`%${name}%`); }
  if (department) { sql += " AND department = ?"; params.push(department); }
  if (position) { sql += " AND position = ?"; params.push(position); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY created_at DESC";

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  res.json(rows.map(toEmployee));
});

// Create employee
router.post("/employees", async (req, res): Promise<void> => {
  const b = req.body;
  const stmt = db.prepare(`
    INSERT INTO employees (employee_number, name, department, position, hire_date, phone, email, address, birth_date, is_foreigner, nationality, visa_type, visa_expiry_date, passport_expiry_date, alien_registration_expiry_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    b.employeeNumber, b.name, b.department, b.position, b.hireDate,
    b.phone ?? null, b.email ?? null, b.address ?? null, b.birthDate ?? null,
    b.isForeigner ? 1 : 0, b.nationality ?? null, b.visaType ?? null,
    b.visaExpiryDate ?? null, b.passportExpiryDate ?? null,
    b.alienRegistrationExpiryDate ?? null, b.notes ?? null
  );
  const row = db.prepare("SELECT * FROM employees WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json(toEmployee(row));
});

// Get employee detail
router.get("/employees/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const row = db.prepare("SELECT * FROM employees WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: "직원을 찾을 수 없습니다." }); return; }
  res.json(toEmployeeDetail(row));
});

// Update employee
router.put("/employees/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const b = req.body;
  db.prepare(`
    UPDATE employees SET
      employee_number = ?, name = ?, department = ?, position = ?, hire_date = ?,
      phone = ?, email = ?, address = ?, birth_date = ?, is_foreigner = ?,
      nationality = ?, visa_type = ?, visa_expiry_date = ?, passport_expiry_date = ?,
      alien_registration_expiry_date = ?, notes = ?
    WHERE id = ?
  `).run(
    b.employeeNumber, b.name, b.department, b.position, b.hireDate,
    b.phone ?? null, b.email ?? null, b.address ?? null, b.birthDate ?? null,
    b.isForeigner ? 1 : 0, b.nationality ?? null, b.visaType ?? null,
    b.visaExpiryDate ?? null, b.passportExpiryDate ?? null,
    b.alienRegistrationExpiryDate ?? null, b.notes ?? null, id
  );
  const row = db.prepare("SELECT * FROM employees WHERE id = ?").get(id) as Record<string, unknown>;
  res.json(toEmployee(row));
});

// Delete employee
router.delete("/employees/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  db.prepare("DELETE FROM employees WHERE id = ?").run(id);
  res.status(204).end();
});

// Update employee status (재직 / 휴직 / 퇴사)
router.patch("/employees/:id/status", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status, statusNote } = req.body as { status: string; statusNote?: string };

  const allowed = ["재직", "휴직", "퇴사"];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: "status는 재직 | 휴직 | 퇴사 중 하나여야 합니다." });
    return;
  }

  db.prepare(`
    UPDATE employees
    SET status = ?, status_changed_at = datetime('now'), status_note = ?
    WHERE id = ?
  `).run(status, statusNote ?? null, id);

  const row = db.prepare("SELECT * FROM employees WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: "직원을 찾을 수 없습니다." }); return; }
  res.json(toEmployeeDetail(row));
});

// ─── Personnel History ───────────────────────────────────────────────────────
router.get("/employees/:id/personnel-history", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const rows = db.prepare("SELECT * FROM personnel_history WHERE employee_id = ? ORDER BY date DESC").all(id) as Record<string, unknown>[];
  res.json(rows.map(r => ({
    id: r.id, employeeId: r.employee_id, type: r.type, date: r.date,
    description: r.description, previousDepartment: r.previous_department ?? null,
    newDepartment: r.new_department ?? null, previousPosition: r.previous_position ?? null,
    newPosition: r.new_position ?? null, createdAt: r.created_at,
  })));
});

router.post("/employees/:id/personnel-history", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const b = req.body;
  const result = db.prepare(`
    INSERT INTO personnel_history (employee_id, type, date, description, previous_department, new_department, previous_position, new_position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, b.type, b.date, b.description, b.previousDepartment ?? null, b.newDepartment ?? null, b.previousPosition ?? null, b.newPosition ?? null);
  const row = db.prepare("SELECT * FROM personnel_history WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json({
    id: row.id, employeeId: row.employee_id, type: row.type, date: row.date,
    description: row.description, previousDepartment: row.previous_department ?? null,
    newDepartment: row.new_department ?? null, previousPosition: row.previous_position ?? null,
    newPosition: row.new_position ?? null, createdAt: row.created_at,
  });
});

router.put("/personnel-history/:rid", async (req, res): Promise<void> => {
  const rid = parseInt(Array.isArray(req.params.rid) ? req.params.rid[0] : req.params.rid, 10);
  const b = req.body;
  db.prepare(`
    UPDATE personnel_history SET type=?, date=?, description=?, previous_department=?, new_department=?, previous_position=?, new_position=?
    WHERE id=?
  `).run(b.type, b.date, b.description, b.previousDepartment ?? null, b.newDepartment ?? null, b.previousPosition ?? null, b.newPosition ?? null, rid);
  const row = db.prepare("SELECT * FROM personnel_history WHERE id=?").get(rid) as Record<string, unknown>;
  res.json({ id: row.id, employeeId: row.employee_id, type: row.type, date: row.date, description: row.description, previousDepartment: row.previous_department ?? null, newDepartment: row.new_department ?? null, previousPosition: row.previous_position ?? null, newPosition: row.new_position ?? null, createdAt: row.created_at });
});

router.delete("/personnel-history/:rid", async (req, res): Promise<void> => {
  const rid = parseInt(Array.isArray(req.params.rid) ? req.params.rid[0] : req.params.rid, 10);
  db.prepare("DELETE FROM personnel_history WHERE id=?").run(rid);
  res.status(204).end();
});

// ─── Education ───────────────────────────────────────────────────────────────
router.get("/employees/:id/education", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const rows = db.prepare("SELECT * FROM education WHERE employee_id = ? ORDER BY date DESC").all(id) as Record<string, unknown>[];
  res.json(rows.map(r => ({
    id: r.id, employeeId: r.employee_id, name: r.name, date: r.date,
    completed: r.completed === 1, certificateFile: r.certificate_file ?? null,
    notes: r.notes ?? null, createdAt: r.created_at,
  })));
});

router.post("/employees/:id/education", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const b = req.body;
  const result = db.prepare(`
    INSERT INTO education (employee_id, name, date, completed, certificate_file, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, b.name, b.date, b.completed ? 1 : 0, b.certificateFile ?? null, b.notes ?? null);
  const row = db.prepare("SELECT * FROM education WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json({
    id: row.id, employeeId: row.employee_id, name: row.name, date: row.date,
    completed: row.completed === 1, certificateFile: row.certificate_file ?? null,
    notes: row.notes ?? null, createdAt: row.created_at,
  });
});

router.put("/education/:rid", async (req, res): Promise<void> => {
  const rid = parseInt(Array.isArray(req.params.rid) ? req.params.rid[0] : req.params.rid, 10);
  const b = req.body;
  db.prepare("UPDATE education SET name=?, date=?, completed=?, notes=? WHERE id=?")
    .run(b.name, b.date, b.completed ? 1 : 0, b.notes ?? null, rid);
  const row = db.prepare("SELECT * FROM education WHERE id=?").get(rid) as Record<string, unknown>;
  res.json({ id: row.id, employeeId: row.employee_id, name: row.name, date: row.date, completed: row.completed === 1, certificateFile: row.certificate_file ?? null, notes: row.notes ?? null, createdAt: row.created_at });
});

router.delete("/education/:rid", async (req, res): Promise<void> => {
  const rid = parseInt(Array.isArray(req.params.rid) ? req.params.rid[0] : req.params.rid, 10);
  db.prepare("DELETE FROM education WHERE id=?").run(rid);
  res.status(204).end();
});

// ─── Rewards ─────────────────────────────────────────────────────────────────
router.get("/employees/:id/rewards", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const rows = db.prepare("SELECT * FROM rewards WHERE employee_id = ? ORDER BY date DESC").all(id) as Record<string, unknown>[];
  res.json(rows.map(r => ({ id: r.id, employeeId: r.employee_id, type: r.type, date: r.date, content: r.content, createdAt: r.created_at })));
});

router.post("/employees/:id/rewards", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const b = req.body;
  const result = db.prepare("INSERT INTO rewards (employee_id, type, date, content) VALUES (?, ?, ?, ?)").run(id, b.type, b.date, b.content);
  const row = db.prepare("SELECT * FROM rewards WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json({ id: row.id, employeeId: row.employee_id, type: row.type, date: row.date, content: row.content, createdAt: row.created_at });
});

router.put("/rewards/:rid", async (req, res): Promise<void> => {
  const rid = parseInt(Array.isArray(req.params.rid) ? req.params.rid[0] : req.params.rid, 10);
  const b = req.body;
  db.prepare("UPDATE rewards SET type=?, date=?, content=? WHERE id=?").run(b.type, b.date, b.content, rid);
  const row = db.prepare("SELECT * FROM rewards WHERE id=?").get(rid) as Record<string, unknown>;
  res.json({ id: row.id, employeeId: row.employee_id, type: row.type, date: row.date, content: row.content, createdAt: row.created_at });
});

router.delete("/rewards/:rid", async (req, res): Promise<void> => {
  const rid = parseInt(Array.isArray(req.params.rid) ? req.params.rid[0] : req.params.rid, 10);
  db.prepare("DELETE FROM rewards WHERE id=?").run(rid);
  res.status(204).end();
});

// ─── Disciplinary ─────────────────────────────────────────────────────────────
router.get("/employees/:id/disciplinary", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const rows = db.prepare("SELECT * FROM disciplinary WHERE employee_id = ? ORDER BY date DESC").all(id) as Record<string, unknown>[];
  res.json(rows.map(r => ({ id: r.id, employeeId: r.employee_id, disciplinaryType: r.disciplinary_type, date: r.date, content: r.content, createdAt: r.created_at })));
});

router.post("/employees/:id/disciplinary", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const b = req.body;
  const result = db.prepare("INSERT INTO disciplinary (employee_id, disciplinary_type, date, content) VALUES (?, ?, ?, ?)").run(id, b.disciplinaryType, b.date, b.content);
  const row = db.prepare("SELECT * FROM disciplinary WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json({ id: row.id, employeeId: row.employee_id, disciplinaryType: row.disciplinary_type, date: row.date, content: row.content, createdAt: row.created_at });
});

router.put("/disciplinary/:rid", async (req, res): Promise<void> => {
  const rid = parseInt(Array.isArray(req.params.rid) ? req.params.rid[0] : req.params.rid, 10);
  const b = req.body;
  db.prepare("UPDATE disciplinary SET disciplinary_type=?, date=?, content=? WHERE id=?").run(b.disciplinaryType, b.date, b.content, rid);
  const row = db.prepare("SELECT * FROM disciplinary WHERE id=?").get(rid) as Record<string, unknown>;
  res.json({ id: row.id, employeeId: row.employee_id, disciplinaryType: row.disciplinary_type, date: row.date, content: row.content, createdAt: row.created_at });
});

router.delete("/disciplinary/:rid", async (req, res): Promise<void> => {
  const rid = parseInt(Array.isArray(req.params.rid) ? req.params.rid[0] : req.params.rid, 10);
  db.prepare("DELETE FROM disciplinary WHERE id=?").run(rid);
  res.status(204).end();
});

// ─── Interviews ───────────────────────────────────────────────────────────────
router.get("/employees/:id/interviews", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const rows = db.prepare("SELECT * FROM interviews WHERE employee_id = ? ORDER BY date DESC").all(id) as Record<string, unknown>[];
  res.json(rows.map(r => ({ id: r.id, employeeId: r.employee_id, date: r.date, content: r.content, interviewer: r.interviewer ?? null, createdAt: r.created_at })));
});

router.post("/employees/:id/interviews", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const b = req.body;
  const result = db.prepare("INSERT INTO interviews (employee_id, date, content, interviewer) VALUES (?, ?, ?, ?)").run(id, b.date, b.content, b.interviewer ?? null);
  const row = db.prepare("SELECT * FROM interviews WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json({ id: row.id, employeeId: row.employee_id, date: row.date, content: row.content, interviewer: row.interviewer ?? null, createdAt: row.created_at });
});

router.put("/interviews/:rid", async (req, res): Promise<void> => {
  const rid = parseInt(Array.isArray(req.params.rid) ? req.params.rid[0] : req.params.rid, 10);
  const b = req.body;
  db.prepare("UPDATE interviews SET date=?, content=?, interviewer=? WHERE id=?").run(b.date, b.content, b.interviewer ?? null, rid);
  const row = db.prepare("SELECT * FROM interviews WHERE id=?").get(rid) as Record<string, unknown>;
  res.json({ id: row.id, employeeId: row.employee_id, date: row.date, content: row.content, interviewer: row.interviewer ?? null, createdAt: row.created_at });
});

router.delete("/interviews/:rid", async (req, res): Promise<void> => {
  const rid = parseInt(Array.isArray(req.params.rid) ? req.params.rid[0] : req.params.rid, 10);
  db.prepare("DELETE FROM interviews WHERE id=?").run(rid);
  res.status(204).end();
});

// ─── Foreigner Info ───────────────────────────────────────────────────────────
router.get("/employees/:id/foreigner-info", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const row = db.prepare("SELECT * FROM foreigner_info WHERE employee_id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: "외국인 정보가 없습니다." }); return; }
  res.json({ id: row.id, employeeId: row.employee_id, visaType: row.visa_type, visaExpiryDate: row.visa_expiry_date, passportExpiryDate: row.passport_expiry_date, alienRegistrationExpiryDate: row.alien_registration_expiry_date, notes: row.notes ?? null, updatedAt: row.updated_at });
});

router.put("/employees/:id/foreigner-info", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const b = req.body;
  const existing = db.prepare("SELECT id FROM foreigner_info WHERE employee_id = ?").get(id);
  if (existing) {
    db.prepare("UPDATE foreigner_info SET visa_type=?, visa_expiry_date=?, passport_expiry_date=?, alien_registration_expiry_date=?, notes=?, updated_at=datetime('now') WHERE employee_id=?")
      .run(b.visaType, b.visaExpiryDate, b.passportExpiryDate, b.alienRegistrationExpiryDate, b.notes ?? null, id);
  } else {
    db.prepare("INSERT INTO foreigner_info (employee_id, visa_type, visa_expiry_date, passport_expiry_date, alien_registration_expiry_date, notes) VALUES (?,?,?,?,?,?)")
      .run(id, b.visaType, b.visaExpiryDate, b.passportExpiryDate, b.alienRegistrationExpiryDate, b.notes ?? null);
  }
  const row = db.prepare("SELECT * FROM foreigner_info WHERE employee_id = ?").get(id) as Record<string, unknown>;
  res.json({ id: row.id, employeeId: row.employee_id, visaType: row.visa_type, visaExpiryDate: row.visa_expiry_date, passportExpiryDate: row.passport_expiry_date, alienRegistrationExpiryDate: row.alien_registration_expiry_date, notes: row.notes ?? null, updatedAt: row.updated_at });
});

// ─── Attachments ─────────────────────────────────────────────────────────────
router.get("/employees/:id/attachments", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const rows = db.prepare("SELECT * FROM attachments WHERE employee_id = ? ORDER BY uploaded_at DESC").all(id) as Record<string, unknown>[];
  res.json(rows.map(r => ({ id: r.id, employeeId: r.employee_id, category: r.category, fileName: r.file_name, fileUrl: r.file_url, fileSize: r.file_size ?? null, uploadedAt: r.uploaded_at })));
});

router.post("/employees/:id/attachments", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const b = req.body;
  const result = db.prepare("INSERT INTO attachments (employee_id, category, file_name, file_url, file_size) VALUES (?,?,?,?,?)").run(id, b.category, b.fileName, b.fileUrl, b.fileSize ?? null);
  const row = db.prepare("SELECT * FROM attachments WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json({ id: row.id, employeeId: row.employee_id, category: row.category, fileName: row.file_name, fileUrl: row.file_url, fileSize: row.file_size ?? null, uploadedAt: row.uploaded_at });
});

router.delete("/attachments/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  db.prepare("DELETE FROM attachments WHERE id = ?").run(id);
  res.status(204).end();
});

// ─── Timeline ────────────────────────────────────────────────────────────────
router.get("/employees/:id/timeline", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const events: { date: string; type: string; description: string; category: string }[] = [];

  const history = db.prepare("SELECT * FROM personnel_history WHERE employee_id = ?").all(id) as Record<string, unknown>[];
  for (const r of history) {
    events.push({ date: r.date as string, type: r.type as string, description: r.description as string, category: "인사이력" });
  }

  const education = db.prepare("SELECT * FROM education WHERE employee_id = ?").all(id) as Record<string, unknown>[];
  for (const r of education) {
    events.push({ date: r.date as string, type: "교육", description: `${r.name}${r.completed ? " (수료)" : " (예정)"}`, category: "교육이력" });
  }

  const rewards = db.prepare("SELECT * FROM rewards WHERE employee_id = ?").all(id) as Record<string, unknown>[];
  for (const r of rewards) {
    events.push({ date: r.date as string, type: r.type as string, description: r.content as string, category: "상벌이력" });
  }

  const disciplinary = db.prepare("SELECT * FROM disciplinary WHERE employee_id = ?").all(id) as Record<string, unknown>[];
  for (const r of disciplinary) {
    events.push({ date: r.date as string, type: "징계", description: `[${r.disciplinary_type}] ${r.content}`, category: "징계이력" });
  }

  const interviews = db.prepare("SELECT * FROM interviews WHERE employee_id = ?").all(id) as Record<string, unknown>[];
  for (const r of interviews) {
    events.push({ date: r.date as string, type: "면담", description: r.content as string, category: "면담기록" });
  }

  events.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  res.json(events);
});

export default router;
