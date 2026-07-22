import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// ─── employees ───────────────────────────────────────────────────────────────
export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeNumber: text("employee_number").notNull().unique(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  hireDate: text("hire_date").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  birthDate: text("birth_date"),
  isForeigner: boolean("is_foreigner").notNull().default(false),
  nationality: text("nationality"),
  visaType: text("visa_type"),
  visaExpiryDate: text("visa_expiry_date"),
  passportExpiryDate: text("passport_expiry_date"),
  alienRegistrationExpiryDate: text("alien_registration_expiry_date"),
  notes: text("notes"),
  status: text("status").notNull().default("재직"),
  statusChangedAt: text("status_changed_at"),
  statusNote: text("status_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── personnel_history ───────────────────────────────────────────────────────
export const personnelHistoryTable = pgTable("personnel_history", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employeesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  date: text("date").notNull(),
  description: text("description").notNull(),
  previousDepartment: text("previous_department"),
  newDepartment: text("new_department"),
  previousPosition: text("previous_position"),
  newPosition: text("new_position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── education ───────────────────────────────────────────────────────────────
export const educationTable = pgTable("education", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employeesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  date: text("date").notNull(),
  completed: boolean("completed").notNull().default(false),
  certificateFile: text("certificate_file"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── rewards ─────────────────────────────────────────────────────────────────
export const rewardsTable = pgTable("rewards", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employeesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  date: text("date").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── disciplinary ────────────────────────────────────────────────────────────
export const disciplinaryTable = pgTable("disciplinary", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employeesTable.id, { onDelete: "cascade" }),
  disciplinaryType: text("disciplinary_type").notNull(),
  date: text("date").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── interviews ──────────────────────────────────────────────────────────────
export const interviewsTable = pgTable("interviews", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employeesTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  content: text("content").notNull(),
  interviewer: text("interviewer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── foreigner_info ──────────────────────────────────────────────────────────
export const foreignerInfoTable = pgTable("foreigner_info", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .unique()
    .references(() => employeesTable.id, { onDelete: "cascade" }),
  visaType: text("visa_type").notNull(),
  visaExpiryDate: text("visa_expiry_date").notNull(),
  passportExpiryDate: text("passport_expiry_date").notNull(),
  alienRegistrationExpiryDate: text("alien_registration_expiry_date").notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── attachments ─────────────────────────────────────────────────────────────
export const attachmentsTable = pgTable("attachments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employeesTable.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// ─── iso_schedules ────────────────────────────────────────────────────────────
export const isoSchedulesTable = pgTable("iso_schedules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── insurance_schedules ─────────────────────────────────────────────────────
export const insuranceSchedulesTable = pgTable("insurance_schedules", {
  id: serial("id").primaryKey(),
  insuranceName: text("insurance_name").notNull(),
  renewalDate: text("renewal_date").notNull(),
  insurer: text("insurer"),
  amount: integer("amount"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── documents ───────────────────────────────────────────────────────────────
export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  employeeId: integer("employee_id").references(() => employeesTable.id, {
    onDelete: "set null",
  }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});
