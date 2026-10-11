import { useQuery } from "@tanstack/react-query";
import { fetchCampuses } from "../api/school";

export const useCampuses = (schoolId?: string) =>
  useQuery({
    queryKey: ["campuses", schoolId],
    queryFn: fetchCampuses,
    enabled: !!schoolId,
  });
