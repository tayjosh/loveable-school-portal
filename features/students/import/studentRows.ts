import { z } from "zod";
import { parseCsv } from "./parseCsv";
import type { NewStudent } from "../students.definitions";

export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export interface ImportCampus { id: string; name: string }

export interface ParsedRow {
  line: number;            // spreadsheet row number (header = row 1)
  student?: NewStudent;    // present when the row is valid and new
  errors: string[];
  duplicate?: "file" | "enrolled";
}

export interface ParseOutcome {
  rows: ParsedRow[];
  fatal?: string;          // problem with the file as a whole
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9&]/g, "");

const HEADERS: Record<string, string> = {
  firstname: "firstName", first: "firstName", givenname: "firstName",
  lastname: "lastName", last: "lastName", surname: "lastName", familyname: "lastName",
  email: "email", emailaddress: "email",
  phone: "phone", phonenumber: "phone", mobile: "phone",
  program: "program", programtype: "program", course: "program",
  campus: "campus", campusname: "campus", location: "campus",
  startdate: "startDate", start: "startDate", enrolled: "startDate", enrollmentdate: "startDate",
  graduationdate: "graduationDate", expectedgraduation: "graduationDate",
  expectedgraduationdate: "graduationDate", graduation: "graduationDate",
};

const PROGRAM_ALIASES: Record<string, string> = {
  apmechanic: "AP_MECHANIC", "a&pmechanic": "AP_MECHANIC", "a&p": "AP_MECHANIC", ap: "AP_MECHANIC",
  amt: "AP_MECHANIC", maintenance: "AP_MECHANIC", aircraftmaintenance: "AP_MECHANIC",
  airframe: "AIRFRAME", powerplant: "POWERPLANT",
  dispatcher: "DISPATCHER", dispatch: "DISPATCHER", aircraftdispatcher: "DISPATCHER",
};

export const parseProgram = (raw: string): string | null => PROGRAM_ALIASES[norm(raw)] ?? null;

/** Accepts YYYY-MM-DD or M/D/YYYY. Returns ISO date or null if not a real date. */
export function parseDate(raw: string): string | null {
  const v = raw.trim();
  let y: number, m: number, d: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  if (match) { y = +match[1]; m = +match[2]; d = +match[3]; }
  else if ((match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v))) { m = +match[1]; d = +match[2]; y = +match[3]; }
  else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  if (y < 1990 || y > 2100) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const emailSchema = z.string().email();

export function parseStudentsCsv(
  text: string,
  campuses: ImportCampus[],
  existingEmails: Set<string>,
): ParseOutcome {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], fatal: "The file has no student rows. Use the template and add one student per row." };
  if (table.length - 1 > MAX_IMPORT_ROWS)
    return { rows: [], fatal: `Too many rows (${table.length - 1}). Please import at most ${MAX_IMPORT_ROWS} at a time.` };

  const colOf: Record<string, number> = {};
  table[0].forEach((h, i) => {
    const key = HEADERS[norm(h)];
    if (key && !(key in colOf)) colOf[key] = i;
  });
  const missing = ["firstName", "lastName", "email", "program"].filter((k) => !(k in colOf));
  if (missing.length) {
    const label: Record<string, string> = { firstName: "First Name", lastName: "Last Name", email: "Email", program: "Program" };
    return { rows: [], fatal: `Missing column(s): ${missing.map((m) => label[m]).join(", ")}. Download the template to see the expected columns.` };
  }

  const campusByName = new Map(campuses.map((c) => [norm(c.name), c.id]));
  const seen = new Set<string>();
  const get = (r: string[], k: string) => (k in colOf ? (r[colOf[k]] ?? "").trim() : "");

  const rows: ParsedRow[] = table.slice(1).map((r, idx) => {
    const line = idx + 2;
    const errors: string[] = [];
    const firstName = get(r, "firstName");
    const lastName = get(r, "lastName");
    const email = get(r, "email").toLowerCase();
    const phone = get(r, "phone");
    const programRaw = get(r, "program");
    const campusRaw = get(r, "campus");
    const startRaw = get(r, "startDate");
    const gradRaw = get(r, "graduationDate");

    if (!firstName) errors.push("First name is missing");
    if (!lastName) errors.push("Last name is missing");
    if (firstName.length > 100 || lastName.length > 100) errors.push("Name is too long");
    if (!email) errors.push("Email is missing");
    else if (!emailSchema.safeParse(email).success) errors.push(`"${email}" is not a valid email`);

    const program = parseProgram(programRaw);
    if (!programRaw) errors.push("Program is missing");
    else if (!program) errors.push(`Unknown program "${programRaw}" (use A&P Mechanic, Airframe, Powerplant or Dispatcher)`);

    let campusId: string | null = null;
    if (campusRaw) {
      campusId = campusByName.get(norm(campusRaw)) ?? null;
      if (!campusId) errors.push(`Unknown campus "${campusRaw}"`);
    }

    let startDate: string | null = null;
    if (startRaw) {
      startDate = parseDate(startRaw);
      if (!startDate) errors.push(`Start date "${startRaw}" is not a valid date (use YYYY-MM-DD or MM/DD/YYYY)`);
    }
    let graduationDate: string | null = null;
    if (gradRaw) {
      graduationDate = parseDate(gradRaw);
      if (!graduationDate) errors.push(`Graduation date "${gradRaw}" is not a valid date (use YYYY-MM-DD or MM/DD/YYYY)`);
    }
    if (phone.length > 40) errors.push("Phone number is too long");

    if (errors.length) return { line, errors };

    if (existingEmails.has(email)) return { line, errors: [], duplicate: "enrolled" as const };
    if (seen.has(email)) return { line, errors: [], duplicate: "file" as const };
    seen.add(email);

    return {
      line,
      errors: [],
      student: { firstName, lastName, email, phone: phone || undefined, program: program!, campusId, startDate, graduationDate },
    };
  });

  return { rows };
}

export const TEMPLATE_CSV =
  "First Name,Last Name,Email,Phone,Program,Campus,Start Date,Graduation Date\n" +
  "Jane,Smith,jane.smith@example.com,555-0100,A&P Mechanic,Main Campus,2026-01-12,2027-06-30\n";
