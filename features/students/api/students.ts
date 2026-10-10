import axiosInstance from "@/shared/libs/axiosConfig";
import { LicenseStatus, Student } from "../students.definitions";

/* eslint-disable @typescript-eslint/no-explicit-any */
const normalizeStudent = (u: any): Student => {
  const first = u.first_name ?? u.firstName ?? "";
  const last = u.last_name ?? u.lastName ?? "";
  const status = String(
    u.school_certificate_status ?? u.schoolCertificateStatus ?? "UNLICENSED",
  ).toUpperCase() as LicenseStatus;
  return {
    id: String(u.id ?? u.user_id ?? ""),
    name: u.name ?? u.full_name ?? (`${first} ${last}`.trim() || u.email || ""),
    email: u.email ?? "",
    campusId: String(u.campus_id ?? u.campusId ?? ""),
    program: u.profession ?? u.program ?? u.certificate_type ?? u.certificateType ?? "",
    graduationDate:
      u.expected_graduation_date ?? u.expectedGraduation ?? u.expectedGraduationDate ?? "",
    status,
    applications: Number(u.applications_count ?? u.applicationsCount ?? 0),
    createdAt: u.created_at ?? u.createdAt ?? u.enrolled_at ?? "",
  };
};

// The backend scopes results to the signed-in admin (campus admins only get
// their campus), so the portal never has to trust a client-side filter for
// access control. Filtering below is purely for convenience.
export const fetchSchoolStudents = async (schoolId: string): Promise<Student[]> => {
  const res = await axiosInstance.get(
    `/v1/schools/${encodeURIComponent(schoolId)}/students?page=1&limit=1000`,
  );
  const payload = res.data;
  const rows = payload?.data ?? payload?.rows ?? payload?.results ?? [];
  return rows.map(normalizeStudent);
};

export const updateStudentStatus = async (studentId: string, status: LicenseStatus) => {
  const res = await axiosInstance.patch(
    `/v1/users/${encodeURIComponent(studentId)}`,
    { schoolCertificateStatus: status },
  );
  return res.data;
};
