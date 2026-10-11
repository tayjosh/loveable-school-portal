"use client";

import { useAuth } from "@/features/auth/context/AuthContext";

export default function DashboardPage() {
  const { membership } = useAuth();
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-[#1E3A5F]">
        Welcome back, {membership?.fullName}
      </h1>
      <p className="text-slate-500">Dashboard stats are coming in a later step.</p>
    </div>
  );
}
