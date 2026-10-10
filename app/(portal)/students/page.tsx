"use client";

import { useState } from "react";
import { Button } from "@/shared/ui-components/controls/button";
import { StudentsTable } from "@/features/students/components/StudentsTable";
import { useStudents, useUpdateStudentStatus } from "@/features/students/hooks/useStudents";
import { useMySchoolId, useSchoolCampuses } from "@/features/school/hooks/useSchool";

export default function StudentsPage() {
  const { data: schoolId, isLoading: loadingSchool } = useMySchoolId();
  const { data: campuses = [] } = useSchoolCampuses(schoolId);
  const { data: students = [], isLoading, isError } = useStudents(schoolId);
  const updateStatus = useUpdateStudentStatus(schoolId);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Students</h1>
        {/* Wired up in the Jobs step (bulk send to job bucket) */}
        <Button disabled={selected.size === 0}>
          Send Job{selected.size > 0 ? ` (${selected.size})` : ""}
        </Button>
      </div>
      {isError && (
        <p className="text-sm text-red-600">Could not load students. Please refresh and try again.</p>
      )}
      <StudentsTable
        students={students}
        campuses={campuses}
        isLoading={loadingSchool || isLoading}
        onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
        selected={selected}
        onSelectedChange={setSelected}
      />
    </div>
  );
}
