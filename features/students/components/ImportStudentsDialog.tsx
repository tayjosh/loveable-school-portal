"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/shared/ui-components/controls/dialog";
import type { Campus } from "@/features/school/api/school";
import { useCreateStudents } from "../hooks/useStudents";
import {
  MAX_IMPORT_BYTES, ParseOutcome, TEMPLATE_CSV, parseStudentsCsv,
} from "../import/studentRows";
import type { Student } from "../students.definitions";

interface Props {
  schoolId?: string;
  userId?: string;
  campuses: Campus[];
  students: Student[];
}

export function ImportStudentsDialog({ schoolId, userId, campuses, students }: Props) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [outcome, setOutcome] = useState<ParseOutcome | null>(null);
  const [done, setDone] = useState<{ inserted: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const create = useCreateStudents(schoolId, userId);

  const reset = () => { setFileName(""); setOutcome(null); setDone(null); if (fileRef.current) fileRef.current.value = ""; };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) reset();
  };

  const summary = useMemo(() => {
    const rows = outcome?.rows ?? [];
    return {
      ready: rows.filter((r) => r.student),
      errors: rows.filter((r) => r.errors.length),
      dupes: rows.filter((r) => r.duplicate),
    };
  }, [outcome]);

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "students-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file?: File) => {
    setDone(null);
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { toast.error("File is too large (2 MB max)."); reset(); return; }
    if (!/\.csv$/i.test(file.name)) { toast.error("Please upload a .csv file. In Excel: File > Save As > CSV."); reset(); return; }
    const text = await file.text();
    setFileName(file.name);
    setOutcome(parseStudentsCsv(text, campuses, new Set(students.map((s) => s.email.toLowerCase()))));
  };

  const doImport = async () => {
    try {
      const res = await create.mutateAsync({
        rows: summary.ready.map((r) => r.student!),
        fileName,
        failedRows: summary.errors.length,
        errors: summary.errors.map((r) => ({ row: r.line, problems: r.errors })),
      });
      setDone(res);
      toast.success(`${res.inserted} student${res.inserted === 1 ? "" : "s"} imported`);
    } catch {
      toast.error("The import failed. Nothing was lost; please try again.");
    }
  };

  const problemRows = [...summary.errors, ...summary.dupes].sort((a, b) => a.line - b.line).slice(0, 50);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline"><FileUp className="mr-2 h-4 w-4" />Import CSV</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import students from a spreadsheet</DialogTitle>
          <DialogDescription>
            Upload a .csv file (in Excel: File &gt; Save As &gt; CSV). Nothing is saved until you confirm.
          </DialogDescription>
        </DialogHeader>

        {!done && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />Download template
              </Button>
              <input
                ref={fileRef} type="file" accept=".csv,text/csv" aria-label="Choose CSV file"
                onChange={(e) => onFile(e.target.files?.[0])} className="text-sm"
              />
            </div>

            {outcome?.fatal && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{outcome.fatal}</p>}

            {outcome && !outcome.fatal && (
              <>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded border bg-green-50 p-3"><div className="text-2xl font-semibold text-green-700">{summary.ready.length}</div>ready to import</div>
                  <div className="rounded border bg-slate-50 p-3"><div className="text-2xl font-semibold text-slate-600">{summary.dupes.length}</div>already enrolled / repeated</div>
                  <div className="rounded border bg-red-50 p-3"><div className="text-2xl font-semibold text-red-700">{summary.errors.length}</div>need fixing</div>
                </div>
                {problemRows.length > 0 && (
                  <div className="max-h-52 overflow-auto rounded border text-sm">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-slate-50 text-left"><tr><th className="p-2">Row</th><th className="p-2">Problem</th></tr></thead>
                      <tbody>
                        {problemRows.map((r) => (
                          <tr key={r.line} className="border-t">
                            <td className="p-2">{r.line}</td>
                            <td className="p-2">
                              {r.errors.length ? r.errors.join("; ")
                                : r.duplicate === "enrolled" ? "Already enrolled. Will be skipped."
                                : "Same email appears earlier in this file. Will be skipped."}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {summary.errors.length > 0 && (
                  <p className="text-xs text-slate-500">Rows that need fixing are not imported. Fix them in your spreadsheet and upload again; students already imported are skipped automatically.</p>
                )}
              </>
            )}
          </div>
        )}

        {done && (
          <p className="rounded bg-green-50 p-4 text-sm text-green-800">
            Imported {done.inserted} student{done.inserted === 1 ? "" : "s"}
            {done.skipped > 0 ? `; ${done.skipped} already enrolled and skipped` : ""}.
          </p>
        )}

        <DialogFooter>
          {done ? (
            <Button onClick={() => handleOpenChange(false)}>Close</Button>
          ) : (
            <Button className="bg-[#1E3A5F]" disabled={summary.ready.length === 0 || create.isPending} onClick={doImport}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {summary.ready.length || ""} student{summary.ready.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
