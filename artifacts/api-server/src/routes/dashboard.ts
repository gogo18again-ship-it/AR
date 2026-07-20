import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const totalEmployees = (db.prepare("SELECT COUNT(*) as c FROM employees").get() as { c: number }).c;
  const foreignEmployees = (db.prepare("SELECT COUNT(*) as c FROM employees WHERE is_foreigner = 1").get() as { c: number }).c;

  const visaExpiringSoon = (db.prepare(
    "SELECT COUNT(*) as c FROM foreigner_info WHERE visa_expiry_date BETWEEN ? AND ?"
  ).get(today, in90Days) as { c: number }).c;

  const educationUpcoming = (db.prepare(
    "SELECT COUNT(*) as c FROM education WHERE date BETWEEN ? AND ? AND completed = 0"
  ).get(today, in30Days) as { c: number }).c;

  const insuranceRenewalSoon = (db.prepare(
    "SELECT COUNT(*) as c FROM insurance_schedules WHERE renewal_date BETWEEN ? AND ?"
  ).get(today, in30Days) as { c: number }).c;

  const isoScheduleCount = (db.prepare(
    "SELECT COUNT(*) as c FROM iso_schedules WHERE scheduled_date >= ?"
  ).get(today) as { c: number }).c;

  res.json({
    totalEmployees,
    foreignEmployees,
    visaExpiringSoon,
    educationUpcoming,
    insuranceRenewalSoon,
    isoScheduleCount,
  });
});

export default router;
