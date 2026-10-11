export type LicenseStatus =
  | "UNLICENSED"
  | "AIRFRAME"
  | "POWERPLANT"
  | "A&P"
  | "DISPATCHER";

export const STATUS_META: Record<LicenseStatus, { label: string; color: string }> = {
  UNLICENSED: { label: "Unlicensed", color: "bg-slate-100 text-slate-700" },
  AIRFRAME: { label: "A (Airframe)", color: "bg-emerald-100 text-emerald-800" },
  POWERPLANT: { label: "P (Powerplant)", color: "bg-emerald-100 text-emerald-800" },
  "A&P": { label: "A&P", color: "bg-green-100 text-green-800" },
  DISPATCHER: { label: "Dispatcher", color: "bg-teal-100 text-teal-800" },
};

export const ALL_STATUSES = Object.keys(STATUS_META) as LicenseStatus[];

// Aircraft maintenance only for now. Pilot programs/statuses will be added
// here (and in the backend enum) when that track launches.
export const PROGRAMS = [
  { value: "AP_MECHANIC", label: "A&P Mechanic" },
  { value: "AIRFRAME", label: "Airframe" },
  { value: "POWERPLANT", label: "Powerplant" },
  { value: "DISPATCHER", label: "Dispatcher" },
] as const;

export const programLabel = (code: string): string =>
  PROGRAMS.find((p) => p.value === code)?.label ?? (code || "—");

export interface Student {
  id: string;
  name: string;
  email: string;
  campusId: string | null;
  program: string;
  graduationDate: string | null;
  status: LicenseStatus;
  enrollmentStatus: string;
}

export interface NewStudent {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  program: string;
  campusId: string | null;
  startDate: string | null;
  graduationDate: string | null;
}

export interface CreateResult {
  inserted: number;
  skipped: number; // already enrolled (same email)
}
