"use client";

import { useState } from "react";
import { Button } from "@/shared/ui-components/controls/button";
import { AddStudentDialog } from "@/features/students/components/AddStudentDialog";
import { ImportStudentsDialog } from "@/features/students/components/ImportStudentsDialog";
import { StudentsTable } from "@/features/students/components/StudentsTable";
import { useStudents, useUpdateStudentStatus } from "@/features/students/hooks/useStudents";
import { useCampuses } from "@/features/school/hooks/useSchool";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function StudentsPage() {
  const { membership, userId } = useAuth();
  const schoolId = membership?.schoolId;
  const { data: campuses = [] } = useCampuses(schoolId);
  const { data: students = [], isLoading, isError } = useStudents(schoolId);
  const updateStatus = useUpdateStudentStatus(schoolId);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Students</h1>
        <div className="flex items-center gap-2">
          <AddStudentDialog schoolId={schoolId} userId={userId} campuses={campuses} />
          <ImportStudentsDialog schoolId={schoolId} userId={userId} campuses={campuses} students={students} />
          {/* Wired up in the Jobs step (send to students' AviHire job buckets) */}
          <Button disabled={selected.size === 0}>
            Send Job{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </div>
      </div>
      {isError && (
        <p className="text-sm text-red-600">Could not load students. Please refresh and try again.</p>
      )}
      <StudentsTable
        students={students}
        campuses={campuses}
        isLoading={isLoading}
        onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
        selected={selected}
        onSelectedChange={setSelected}
      />
    </div>
  );
}
