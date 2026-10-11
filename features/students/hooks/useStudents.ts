import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchStudents, updateStudentStatus } from "../api/students";
import { LicenseStatus, STATUS_META, Student } from "../students.definitions";

export const useStudents = (schoolId?: string) =>
  useQuery({
    queryKey: ["students", schoolId],
    queryFn: fetchStudents,
    enabled: !!schoolId,
  });

export const useUpdateStudentStatus = (schoolId?: string) => {
  const qc = useQueryClient();
  const key = ["students", schoolId];
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LicenseStatus }) =>
      updateStudentStatus(id, status),
    // Show the new status immediately; roll back if the database refuses.
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
