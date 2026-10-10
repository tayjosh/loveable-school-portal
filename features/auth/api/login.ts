import axiosInstance from "@/shared/libs/axiosConfig";
import { SignInCredentials, SignInResponse } from "../auth.definitions";

export const loginUser = async (
  credentials: SignInCredentials,
): Promise<SignInResponse> => {
  const response = await axiosInstance.post("/v1/auth/sign-in", credentials);
  return response.data;
};
