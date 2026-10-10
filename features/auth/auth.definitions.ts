export enum Roles {
  SCHOOL_ADMIN = "SCHOOL_ADMIN",
  CAMPUS_ADMIN = "CAMPUS_ADMIN",
}

export const PORTAL_ROLES: string[] = [Roles.SCHOOL_ADMIN, Roles.CAMPUS_ADMIN];

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignInResponse {
  status: boolean;
  message: string;
  data: { accessToken?: string } | null;
}

export interface UserData {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  fullName?: string;
  companyId?: string;
  campus_id?: string;
}
