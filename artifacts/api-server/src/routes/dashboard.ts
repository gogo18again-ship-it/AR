import { Router } from "express";
import { and, count, eq, gte, lte } from "drizzle-orm";
import {
  db,
  educationTable,
  employeesTable,
  foreignerInfoTable,
  insuranceSchedulesTable,
  isoSchedulesTable,
} from "../lib/db";

const router = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [
    [{ total }],
    [{ foreign }],
    [{ visa }],
    [{ education }],
    [{ insurance }],
    [{ iso }],
  ] = await Promise.all([
    db.select({ total: count() }).from(employeesTable),
    db.select({ foreign: count() }).from(employeesTable).where(eq(employeesTable.isForeigner, true)),
    db.select({ visa: count() }).from(foreignerInfoTable).where(
      and(gte(foreignerInfoTable.visaExpiryDate, today), lte(foreignerInfoTable.visaExpiryDate, in90Days))
    ),
    db.select({ education: count() }).from(educationTable).where(
      and(gte(educationTable.date, today), lte(educationTable.date, in30Days), eq(educationTable.completed, false))
    ),
    db.select({ insurance: count() }).from(insuranceSchedulesTable).where(
      and(gte(insuranceSchedulesTable.renewalDate, today), lte(insuranceSchedulesTable.renewalDate, in30Days))
    ),
    db.select({ iso: count() }).from(isoSchedulesTable).where(gte(isoSchedulesTable.scheduledDate, today)),
  ]);

  res.json({
    totalEmployees: Number(total),
    foreignEmployees: Number(foreign),
    visaExpiringSoon: Number(visa),
    educationUpcoming: Number(education),
    insuranceRenewalSoon: Number(insurance),
    isoScheduleCount: Number(iso),
  });
});

export default router;
