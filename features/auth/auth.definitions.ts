export type MemberRole = "main_admin" | "admin";

export interface Membership {
  schoolId: string;
  schoolName: string;
  role: MemberRole;
  fullName: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}
