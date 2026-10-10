import axiosInstance from "@/shared/libs/axiosConfig";

export interface Campus {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

export const fetchMySchoolId = async (): Promise<string | null> => {
  const res = await axiosInstance.get("/v1/users/me/school-id");
  return res.data?.data?.schoolId ?? null;
};

export const fetchSchoolCampuses = async (schoolId: string): Promise<Campus[]> => {
  const res = await axiosInstance.get(
    `/v1/schools/${encodeURIComponent(schoolId)}/campuses`,
  );
  const payload = res.data;
  return payload?.data ?? payload?.rows ?? (Array.isArray(payload) ? payload : []);
};
