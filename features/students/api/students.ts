import { supabase } from "@/shared/libs/supabase";
import { LicenseStatus, Student } from "../students.definitions";

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
  const { error } = await supabase
    .from("students")
    .update({ license_status: status })
    .eq("id", id);
  if (error) throw error;
};
