import { supabase } from "@/shared/libs/supabase";
import { isDemo } from "@/shared/libs/demo";
import { demoStudents } from "@/features/demo/demoStore";
import { CreateResult, LicenseStatus, NewStudent, Student } from "../students.definitions";

interface Row {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  campus_id: string | null;
  program: string;
  expected_graduation_date: string | null;
  license_status: LicenseStatus;
  enrollment_status: string;
}

// The database (row-level security) only returns this staff member's school.
export const fetchStudents = async (): Promise<Student[]> => {
  if (isDemo) return demoStudents.list();
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, first_name, last_name, email, campus_id, program, expected_graduation_date, license_status, enrollment_status",
    )
    .order("last_name")
    .limit(5000)
    .returns<Row[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: `${r.first_name} ${r.last_name}`.trim(),
    email: r.email,
    campusId: r.campus_id,
    program: r.program,
    graduationDate: r.expected_graduation_date,
    status: r.license_status,
    enrollmentStatus: r.enrollment_status,
  }));
};

// Each change is also recorded automatically in license_events (who and when).
export const updateStudentStatus = async (id: string, status: LicenseStatus) => {
  if (isDemo) return demoStudents.setStatus(id, status);
  const { error } = await supabase
    .from("students")
    .update({ license_status: status })
    .eq("id", id);
  if (error) throw error;
};

const CHUNK = 200;

/**
 * Adds students to the signed-in staff member's school. Students whose email is
 * already enrolled are skipped, never overwritten. The database re-checks that
 * the school belongs to the caller (row-level security).
 */
export const createStudents = async (
  schoolId: string,
  userId: string | undefined,
  rows: NewStudent[],
): Promise<CreateResult> => {
  if (isDemo) return demoStudents.create(rows);
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK).map((r) => ({
      school_id: schoolId,
      campus_id: r.campusId,
      first_name: r.firstName,
      last_name: r.lastName,
      email: r.email,
      phone: r.phone ?? null,
      program: r.program,
      start_date: r.startDate,
      expected_graduation_date: r.graduationDate,
      created_by: userId ?? null,
    }));
    const { data, error } = await supabase
      .from("students")
      .upsert(chunk, { onConflict: "school_id,email", ignoreDuplicates: true })
      .select("id");
    if (error) throw error;
    inserted += data?.length ?? 0;
  }
  return { inserted, skipped: rows.length - inserted };
};

export const recordImportBatch = async (
  schoolId: string,
  userId: string | undefined,
  batch: { fileName: string; total: number; imported: number; failed: number; errors: unknown[] },
) => {
  if (isDemo) return;
  await supabase.from("import_batches").insert({
    school_id: schoolId,
    file_name: batch.fileName.slice(0, 200),
    rows_total: batch.total,
    rows_imported: batch.imported,
    rows_failed: batch.failed,
    errors: batch.errors.slice(0, 100),
    created_by: userId ?? null,
  });
};
