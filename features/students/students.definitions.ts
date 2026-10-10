export type LicenseStatus =
  | "UNLICENSED"
  | "AIRFRAME"
  | "POWERPLANT"
  | "A&P"
  | "PILOT"
  | "DISPATCHER";

export const STATUS_META: Record<LicenseStatus, { label: string; color: string }> = {
  UNLICENSED: { label: "Unlicensed", color: "bg-slate-100 text-slate-700" },
  AIRFRAME: { label: "A (Airframe)", color: "bg-emerald-100 text-emerald-800" },
  POWERPLANT: { label: "P (Powerplant)", color: "bg-emerald-100 text-emerald-800" },
  "A&P": { label: "A&P", color: "bg-green-100 text-green-800" },
  PILOT: { label: "Pilot", color: "bg-sky-100 text-sky-800" },
  DISPATCHER: { label: "Dispatcher", color: "bg-teal-100 text-teal-800" },
};

export const ALL_STATUSES = Object.keys(STATUS_META) as LicenseStatus[];

export const PROGRAMS = ["A&P", "Pilot", "Dispatcher"] as const;

export interface Student {
  id: string;
  name: string;
  email: string;
  campusId: string;
  program: string;
  graduationDate: string;
  status: LicenseStatus;
  applications: number;
  createdAt: string;
}

export interface StudentsPage {
  students: Student[];
  total: number;
}
