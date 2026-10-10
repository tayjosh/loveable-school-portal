import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchSchoolStudents, updateStudentStatus } from "../api/students";
import { LicenseStatus, STATUS_META, Student } from "../students.definitions";

export const useStudents = (schoolId?: string | null) =>
  useQuery({
    queryKey: ["school-students", schoolId],
    queryFn: () => fetchSchoolStudents(String(schoolId)),
    enabled: !!schoolId,
  });

export const useUpdateStudentStatus = (schoolId?: string | null) => {
  const qc = useQueryClient();
  const key = ["school-students", schoolId];
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LicenseStatus }) =>
      updateStudentStatus(id, status),
    // Optimistic: show the new status immediately, roll back if the API refuses.
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Student[]>(key);
      qc.setQueryData<Student[]>(key, (old) =>
        old?.map((s) => (s.id === id ? { ...s, status } : s)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error("Could not update the student's status");
    },
    onSuccess: (_d, { status }) =>
      toast.success(`Status updated to ${STATUS_META[status].label}`),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
};
