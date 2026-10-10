import { useQuery } from "@tanstack/react-query";
import { fetchMySchoolId, fetchSchoolCampuses } from "../api/school";

export const useMySchoolId = () =>
  useQuery({ queryKey: ["my-school-id"], queryFn: fetchMySchoolId });

export const useSchoolCampuses = (schoolId?: string | null) =>
  useQuery({
    queryKey: ["school-campuses", schoolId],
    queryFn: () => fetchSchoolCampuses(String(schoolId)),
    enabled: !!schoolId,
  });
