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

// Backend values vary ("AP_MECHANIC", "A&P Mechanic", "A&P"), so compare on a
// normalised key rather than the raw text.
export const normalizeProgram = (raw: string): string => {
  const k = (raw || "").toUpperCase().replace(/[^A-Z&]/g, "");
  if (k === "APMECHANIC" || k === "A&PMECHANIC" || k === "A&P" || k === "MAINTENANCE") return "AP_MECHANIC";
  return k;
};

export const programLabel = (raw: string): string =>
  PROGRAMS.find((p) => p.value === normalizeProgram(raw))?.label ?? (raw || "—");

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
