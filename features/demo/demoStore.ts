import type { Campus } from "@/features/school/api/school";
import type { Membership } from "@/features/auth/auth.definitions";
import type { CreateResult, LicenseStatus, NewStudent, Student } from "@/features/students/students.definitions";

export const DEMO_MEMBERSHIP: Membership = {
  schoolId: "demo-school",
  schoolName: "Demo Aviation Academy",
  role: "main_admin",
  fullName: "Demo Admin",
};

export const DEMO_CAMPUSES: Campus[] = [
  { id: "demo-campus-1", name: "Phoenix Campus", city: "Phoenix", state: "AZ" },
  { id: "demo-campus-2", name: "Dallas Campus", city: "Dallas", state: "TX" },
];

const FIRST = ["Ava", "Liam", "Noah", "Emma", "Mia", "Ethan", "Zoe", "Lucas", "Ivy", "Owen", "Ruby", "Jack"];
const LAST = ["Nguyen", "Garcia", "Smith", "Patel", "Johnson", "Lopez", "Brown", "Kim", "Davis", "Reed"];
const PROGRAMS = ["AP_MECHANIC", "AP_MECHANIC", "AIRFRAME", "POWERPLANT", "DISPATCHER"];
const STATUSES: LicenseStatus[] = ["UNLICENSED", "UNLICENSED", "UNLICENSED", "AIRFRAME", "POWERPLANT", "A&P"];

const seed = (): Student[] =>
  Array.from({ length: 28 }, (_, i) => {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 3) % LAST.length];
    const month = ((i * 5) % 12) + 1;
    return {
      id: `demo-student-${i + 1}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}@example.com`.toLowerCase(),
      campusId: DEMO_CAMPUSES[i % 2].id,
      program: PROGRAMS[i % PROGRAMS.length],
      graduationDate: `2027-${String(month).padStart(2, "0")}-15`,
      status: STATUSES[i % STATUSES.length],
      enrollmentStatus: "active",
    };
  });

let students: Student[] = seed();
let counter = 1000;
const tick = () => new Promise((r) => setTimeout(r, 150)); // feel like a real request

export const demoStudents = {
  async list(): Promise<Student[]> {
    await tick();
    return [...students];
  },
  async setStatus(id: string, status: LicenseStatus) {
    await tick();
    students = students.map((s) => (s.id === id ? { ...s, status } : s));
  },
  async create(rows: NewStudent[]): Promise<CreateResult> {
    await tick();
    const have = new Set(students.map((s) => s.email));
    let inserted = 0;
    let skipped = 0;
    for (const r of rows) {
      if (have.has(r.email)) { skipped++; continue; }
      have.add(r.email);
      students = [
        ...students,
        {
          id: `demo-student-${++counter}`,
          name: `${r.firstName} ${r.lastName}`.trim(),
          email: r.email,
          campusId: r.campusId,
          program: r.program,
          graduationDate: r.graduationDate,
          status: "UNLICENSED",
          enrollmentStatus: "active",
        },
      ];
      inserted++;
    }
    return { inserted, skipped };
  },
};
