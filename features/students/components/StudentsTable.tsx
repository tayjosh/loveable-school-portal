"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { Input } from "@/shared/ui-components/controls/input";
import { Button } from "@/shared/ui-components/controls/button";
import { Badge } from "@/shared/ui-components/controls/badge";
import { Checkbox } from "@/shared/ui-components/controls/checkbox";
import { Skeleton } from "@/shared/ui-components/controls/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui-components/controls/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui-components/controls/table";
import type { Campus } from "@/features/school/api/school";
import {
  ALL_STATUSES,
  LicenseStatus,
  PROGRAMS,
  programLabel,
  STATUS_META,
  Student,
} from "../students.definitions";

type SortKey = "name" | "email" | "campus" | "program" | "graduationDate" | "status";
const PAGE_SIZE = 15;
const ALL = "all";

interface Props {
  students: Student[];
  campuses: Campus[];
  isLoading: boolean;
  onStatusChange: (id: string, status: LicenseStatus) => void;
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
}

const fmtDate = (d: string | null) => {
  const t = d ? Date.parse(d) : NaN;
  return Number.isNaN(t) ? "—" : new Date(t).toLocaleDateString();
};

export function StudentsTable({
  students,
  campuses,
  isLoading,
  onStatusChange,
  selected,
  onSelectedChange,
}: Props) {
  const [search, setSearch] = useState("");
  const [campus, setCampus] = useState(ALL);
  const [program, setProgram] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [gradFrom, setGradFrom] = useState("");
  const [gradTo, setGradTo] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [page, setPage] = useState(1);

  const campusName = useMemo(
    () => new Map(campuses.map((c) => [String(c.id), c.name])),
    [campuses],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = gradFrom ? Date.parse(gradFrom) : null;
    const to = gradTo ? Date.parse(gradTo) : null;
    const rows = students.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false;
      if (campus !== ALL && (s.campusId ?? "") !== campus) return false;
      if (program !== ALL && s.program !== program) return false;
      if (status !== ALL && s.status !== status) return false;
      const g = s.graduationDate ? Date.parse(s.graduationDate) : NaN;
      if (from !== null && (Number.isNaN(g) || g < from)) return false;
      if (to !== null && (Number.isNaN(g) || g > to)) return false;
      return true;
    });
    const val = (s: Student): string | number => {
      switch (sort.key) {
        case "campus": return campusName.get(s.campusId ?? "") ?? "";
        case "graduationDate": return (s.graduationDate ? Date.parse(s.graduationDate) : 0) || 0;
        default: return String(s[sort.key] ?? "").toLowerCase();
      }
    };
    return [...rows].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
  }, [students, search, campus, program, status, gradFrom, gradTo, sort, campusName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((s) => selected.has(s.id));

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));
  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectedChange(next);
  };
  const togglePage = () => {
    const next = new Set(selected);
    pageRows.forEach((s) => (allOnPageSelected ? next.delete(s.id) : next.add(s.id)));
    onSelectedChange(next);
  };

  const SortHead = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <TableHead>
      <button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort(k)}>
        {children}
        {sort.key === k && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </TableHead>
  );

  const FilterSelect = ({ value, onChange, placeholder, children }: {
    value: string; onChange: (v: string) => void; placeholder: string; children: React.ReactNode;
  }) => (
    <Select value={value} onValueChange={resetPage(onChange)}>
      <SelectTrigger className="w-40"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {children}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {campuses.length > 1 && (
          <FilterSelect value={campus} onChange={setCampus} placeholder="All campuses">
            {campuses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </FilterSelect>
        )}
        <FilterSelect value={program} onChange={setProgram} placeholder="All programs">
          {PROGRAMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
        </FilterSelect>
        <FilterSelect value={status} onChange={setStatus} placeholder="All statuses">
          {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
        </FilterSelect>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          Graduates
          <Input type="date" className="w-36" value={gradFrom} onChange={(e) => { setGradFrom(e.target.value); setPage(1); }} />
          to
          <Input type="date" className="w-36" value={gradTo} onChange={(e) => { setGradTo(e.target.value); setPage(1); }} />
        </label>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allOnPageSelected} onCheckedChange={togglePage} aria-label="Select all on page" />
              </TableHead>
              <SortHead k="name">Name</SortHead>
              <SortHead k="email">Email</SortHead>
              <SortHead k="campus">Campus</SortHead>
              <SortHead k="program">Program</SortHead>
              <SortHead k="graduationDate">Graduation</SortHead>
              <SortHead k="status">Status</SortHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell>
                </TableRow>
              ))}
            {!isLoading && pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                  No students match your filters.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleRow(s.id)} aria-label={`Select ${s.name}`} />
                </TableCell>
                <TableCell>
                  <Link href={`/students/${s.id}`} className="font-medium text-[#1E3A5F] hover:underline">
                    {s.name || "—"}
                  </Link>
                </TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{campusName.get(s.campusId ?? "") ?? "—"}</TableCell>
                <TableCell>{programLabel(s.program)}</TableCell>
                <TableCell>{fmtDate(s.graduationDate)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button aria-label={`Change status for ${s.name}`}>
                        <Badge className={STATUS_META[s.status]?.color ?? STATUS_META.UNLICENSED.color}>
                          {STATUS_META[s.status]?.label ?? s.status}
                        </Badge>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {ALL_STATUSES.map((opt) => (
                        <DropdownMenuItem key={opt} onClick={() => opt !== s.status && onStatusChange(s.id, opt)}>
                          <Badge className={STATUS_META[opt].color}>{STATUS_META[opt].label}</Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{filtered.length} student{filtered.length === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>Previous</Button>
          <span>Page {safePage} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
