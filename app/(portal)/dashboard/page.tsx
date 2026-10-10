"use client";

import { useUser } from "@/features/auth/context/AuthContext";

export default function DashboardPage() {
  const { user } = useUser();
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-[#1E3A5F]">
        Welcome back, {user?.full_name || user?.fullName || "Admin"}
      </h1>
      <p className="text-slate-500">Dashboard stats are coming in the next step.</p>
    </div>
  );
}
