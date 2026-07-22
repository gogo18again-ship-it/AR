import { Router } from "express";
import { and, desc, eq, like } from "drizzle-orm";
import { db, documentsTable, employeesTable } from "../lib/db";

const router = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const { category, employeeName } = req.query as Record<string, string | undefined>;
  const conditions = [];
  if (category) conditions.push(eq(documentsTable.category, category));
  if (employeeName) conditions.push(like(employeesTable.name, `%${employeeName}%`));

  const rows = await db
    .select({
      id: documentsTable.id,
      title: documentsTable.title,
      category: documentsTable.category,
      employeeId: documentsTable.employeeId,
      employeeName: employeesTable.name,
      fileName: documentsTable.fileName,
      fileUrl: documentsTable.fileUrl,
      fileSize: documentsTable.fileSize,
      uploadedAt: documentsTable.uploadedAt,
    })
    .from(documentsTable)
    .leftJoin(employeesTable, eq(documentsTable.employeeId, employeesTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(documentsTable.uploadedAt));

  res.json(rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    employeeId: r.employeeId ?? null,
    employeeName: r.employeeName ?? null,
    fileName: r.fileName,
    fileUrl: r.fileUrl,
    fileSize: r.fileSize ?? null,
    uploadedAt: r.uploadedAt,
  })));
});

router.post("/documents", async (req, res): Promise<void> => {
  const b = req.body;
  const [doc] = await db
    .insert(documentsTable)
    .values({
      title: b.title,
      category: b.category,
      employeeId: b.employeeId ?? null,
      fileName: b.fileName,
      fileUrl: b.fileUrl,
      fileSize: b.fileSize ?? null,
    })
    .returning();

  const [row] = await db
    .select({
      id: documentsTable.id,
      title: documentsTable.title,
      category: documentsTable.category,
      employeeId: documentsTable.employeeId,
      employeeName: employeesTable.name,
      fileName: documentsTable.fileName,
      fileUrl: documentsTable.fileUrl,
      fileSize: documentsTable.fileSize,
      uploadedAt: documentsTable.uploadedAt,
    })
    .from(documentsTable)
    .leftJoin(employeesTable, eq(documentsTable.employeeId, employeesTable.id))
    .where(eq(documentsTable.id, doc.id));

  res.status(201).json({
    id: row.id,
    title: row.title,
    category: row.category,
    employeeId: row.employeeId ?? null,
    employeeName: row.employeeName ?? null,
    fileName: row.fileName,
    fileUrl: row.fileUrl,
    fileSize: row.fileSize ?? null,
    uploadedAt: row.uploadedAt,
  });
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.status(204).end();
});

export default router;
