import axiosInstance from "@/shared/libs/axiosConfig";
import { UserData } from "../auth.definitions";

export const fetchCurrentUser = async (): Promise<UserData> => {
  const response = await axiosInstance.get("/v1/auth/me");
  return response.data.data;
};
