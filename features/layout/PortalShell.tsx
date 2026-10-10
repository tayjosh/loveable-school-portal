"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/shared/ui-components/controls/button";
import { useUser } from "@/features/auth/context/AuthContext";
import { Roles } from "@/features/auth/auth.definitions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/campuses", label: "Campuses", icon: Building2 },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/invite-students", label: "Invite Students", icon: QrCode },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users, schoolAdminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  const isSchoolAdmin = String(user.role).toUpperCase() === Roles.SCHOOL_ADMIN;
  const items = NAV.filter((n) => !n.schoolAdminOnly || isSchoolAdmin);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-white md:flex">
        <div className="px-5 py-5 text-lg font-semibold text-[#1E3A5F]">
          AviHire School Portal
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-[#1E3A5F] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <p className="truncate px-2 pb-2 text-xs text-slate-500">
            {user.full_name || user.fullName || user.email}
          </p>
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
