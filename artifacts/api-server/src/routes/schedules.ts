import { Router } from "express";
import { and, asc, eq, gte } from "drizzle-orm";
import {
  db,
  educationTable,
  employeesTable,
  foreignerInfoTable,
  insuranceSchedulesTable,
  isoSchedulesTable,
} from "../lib/db";

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

// Visa schedules
router.get("/schedules/visa", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      employeeId: foreignerInfoTable.employeeId,
      employeeName: employeesTable.name,
      department: employeesTable.department,
      visaType: foreignerInfoTable.visaType,
      visaExpiryDate: foreignerInfoTable.visaExpiryDate,
    })
    .from(foreignerInfoTable)
    .innerJoin(employeesTable, eq(foreignerInfoTable.employeeId, employeesTable.id))
    .orderBy(asc(foreignerInfoTable.visaExpiryDate));

  res.json(
    rows.map((r) => {
      const days = getDaysUntil(r.visaExpiryDate);
      return {
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        department: r.department,
        visaType: r.visaType,
        expiryDate: r.visaExpiryDate,
        daysUntilExpiry: days,
        urgency: days <= 90 ? (days <= 30 ? "danger" : "warning") : "info",
      };
    })
  );
});

// Education schedules (upcoming, not completed)
router.get("/schedules/education", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const rows = await db
    .select({
      id: educationTable.id,
      employeeId: educationTable.employeeId,
      employeeName: employeesTable.name,
      department: employeesTable.department,
      educationName: educationTable.name,
      scheduledDate: educationTable.date,
    })
    .from(educationTable)
    .innerJoin(employeesTable, eq(educationTable.employeeId, employeesTable.id))
    .where(and(gte(educationTable.date, today), eq(educationTable.completed, false)))
    .orderBy(asc(educationTable.date));

  const upcoming = rows;

  res.json(
    upcoming.map((r) => {
      const days = getDaysUntil(r.scheduledDate);
      return {
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        department: r.department,
        educationName: r.educationName,
        scheduledDate: r.scheduledDate,
        daysUntil: days,
        urgency: getUrgency(days),
      };
    })
  );
});

// ISO schedules
router.get("/schedules/iso", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(isoSchedulesTable)
    .orderBy(asc(isoSchedulesTable.scheduledDate));
  res.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      scheduledDate: r.scheduledDate,
      type: r.type,
      description: r.description ?? null,
      createdAt: r.createdAt,
    }))
  );
});

router.post("/schedules/iso", async (req, res): Promise<void> => {
  const b = req.body;
  const [row] = await db
    .insert(isoSchedulesTable)
    .values({ title: b.title, scheduledDate: b.scheduledDate, type: b.type, description: b.description ?? null })
    .returning();
  res.status(201).json({
    id: row.id,
    title: row.title,
    scheduledDate: row.scheduledDate,
    type: row.type,
    description: row.description ?? null,
    createdAt: row.createdAt,
  });
});

// Insurance schedules
router.get("/schedules/insurance", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(insuranceSchedulesTable)
    .orderBy(asc(insuranceSchedulesTable.renewalDate));
  res.json(
    rows.map((r) => {
      const days = getDaysUntil(r.renewalDate);
      return {
        id: r.id,
        insuranceName: r.insuranceName,
        renewalDate: r.renewalDate,
        insurer: r.insurer ?? null,
        amount: r.amount ?? null,
        daysUntilRenewal: days,
        urgency: getUrgency(days),
        notes: r.notes ?? null,
        createdAt: r.createdAt,
      };
    })
  );
});

router.post("/schedules/insurance", async (req, res): Promise<void> => {
  const b = req.body;
  const [row] = await db
    .insert(insuranceSchedulesTable)
    .values({
      insuranceName: b.insuranceName,
      renewalDate: b.renewalDate,
      insurer: b.insurer ?? null,
      amount: b.amount ?? null,
      notes: b.notes ?? null,
    })
    .returning();
  const days = getDaysUntil(row.renewalDate);
  res.status(201).json({
    id: row.id,
    insuranceName: row.insuranceName,
    renewalDate: row.renewalDate,
    insurer: row.insurer ?? null,
    amount: row.amount ?? null,
    daysUntilRenewal: days,
    urgency: getUrgency(days),
    notes: row.notes ?? null,
    createdAt: row.createdAt,
  });
});

export default router;
