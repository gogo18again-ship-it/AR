import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

function toDocument(r: Record<string, unknown>) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    employeeId: r.employee_id ?? null,
    employeeName: r.employee_name ?? null,
    fileName: r.file_name,
    fileUrl: r.file_url,
    fileSize: r.file_size ?? null,
    uploadedAt: r.uploaded_at,
  };
}

router.get("/documents", async (req, res): Promise<void> => {
  const { category, employeeName } = req.query as Record<string, string | undefined>;
  let sql = `
    SELECT d.*, e.name as employee_name
    FROM documents d
    LEFT JOIN employees e ON d.employee_id = e.id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (category) { sql += " AND d.category = ?"; params.push(category); }
  if (employeeName) { sql += " AND e.name LIKE ?"; params.push(`%${employeeName}%`); }
  sql += " ORDER BY d.uploaded_at DESC";

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  res.json(rows.map(toDocument));
});

router.post("/documents", async (req, res): Promise<void> => {
  const b = req.body;
  const result = db.prepare(`
    INSERT INTO documents (title, category, employee_id, file_name, file_url, file_size)
    VALUES (?,?,?,?,?,?)
  `).run(b.title, b.category, b.employeeId ?? null, b.fileName, b.fileUrl, b.fileSize ?? null);

  const row = db.prepare(`
    SELECT d.*, e.name as employee_name FROM documents d LEFT JOIN employees e ON d.employee_id = e.id WHERE d.id = ?
  `).get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json(toDocument(row));
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  db.prepare("DELETE FROM documents WHERE id = ?").run(id);
  res.status(204).end();
});

export default router;
