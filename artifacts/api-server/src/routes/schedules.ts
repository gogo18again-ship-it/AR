import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const now = new Date().getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function getUrgency(days: number): string {
  if (days <= 30) return "danger";
  if (days <= 60) return "warning";
  return "info";
}

// Visa schedules (90-day window and beyond, but flagged)
router.get("/schedules/visa", async (req, res): Promise<void> => {
  const rows = db.prepare(`
    SELECT fi.*, e.name, e.department, e.employee_number
    FROM foreigner_info fi
    JOIN employees e ON fi.employee_id = e.id
    ORDER BY fi.visa_expiry_date ASC
  `).all() as Record<string, unknown>[];

  res.json(rows.map(r => {
    const days = getDaysUntil(r.visa_expiry_date as string);
    return {
      employeeId: r.employee_id,
      employeeName: r.name,
      department: r.department,
      visaType: r.visa_type,
      expiryDate: r.visa_expiry_date,
      daysUntilExpiry: days,
      urgency: days <= 90 ? (days <= 30 ? "danger" : "warning") : "info",
    };
  }));
});

// Education schedules (upcoming, not completed)
router.get("/schedules/education", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const rows = db.prepare(`
    SELECT ed.*, e.name, e.department
    FROM education ed
    JOIN employees e ON ed.employee_id = e.id
    WHERE ed.date >= ? AND ed.completed = 0
    ORDER BY ed.date ASC
  `).all(today) as Record<string, unknown>[];

  res.json(rows.map(r => {
    const days = getDaysUntil(r.date as string);
    return {
      id: r.id,
      employeeId: r.employee_id,
      employeeName: r.name,
      department: r.department,
      educationName: r.name as string,
      scheduledDate: r.date,
      daysUntil: days,
      urgency: getUrgency(days),
    };
  }));
});

// ISO schedules
router.get("/schedules/iso", async (req, res): Promise<void> => {
  const rows = db.prepare("SELECT * FROM iso_schedules ORDER BY scheduled_date ASC").all() as Record<string, unknown>[];
  res.json(rows.map(r => ({ id: r.id, title: r.title, scheduledDate: r.scheduled_date, type: r.type, description: r.description ?? null, createdAt: r.created_at })));
});

router.post("/schedules/iso", async (req, res): Promise<void> => {
  const b = req.body;
  const result = db.prepare("INSERT INTO iso_schedules (title, scheduled_date, type, description) VALUES (?,?,?,?)").run(b.title, b.scheduledDate, b.type, b.description ?? null);
  const row = db.prepare("SELECT * FROM iso_schedules WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json({ id: row.id, title: row.title, scheduledDate: row.scheduled_date, type: row.type, description: row.description ?? null, createdAt: row.created_at });
});

// Insurance schedules
router.get("/schedules/insurance", async (req, res): Promise<void> => {
  const rows = db.prepare("SELECT * FROM insurance_schedules ORDER BY renewal_date ASC").all() as Record<string, unknown>[];
  res.json(rows.map(r => {
    const days = getDaysUntil(r.renewal_date as string);
    return {
      id: r.id, insuranceName: r.insurance_name, renewalDate: r.renewal_date,
      insurer: r.insurer ?? null, amount: r.amount ?? null,
      daysUntilRenewal: days, urgency: getUrgency(days),
      notes: r.notes ?? null, createdAt: r.created_at,
    };
  }));
});

router.post("/schedules/insurance", async (req, res): Promise<void> => {
  const b = req.body;
  const result = db.prepare("INSERT INTO insurance_schedules (insurance_name, renewal_date, insurer, amount, notes) VALUES (?,?,?,?,?)").run(b.insuranceName, b.renewalDate, b.insurer ?? null, b.amount ?? null, b.notes ?? null);
  const row = db.prepare("SELECT * FROM insurance_schedules WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  const days = getDaysUntil(row.renewal_date as string);
  res.status(201).json({ id: row.id, insuranceName: row.insurance_name, renewalDate: row.renewal_date, insurer: row.insurer ?? null, amount: row.amount ?? null, daysUntilRenewal: days, urgency: getUrgency(days), notes: row.notes ?? null, createdAt: row.created_at });
});

export default router;
