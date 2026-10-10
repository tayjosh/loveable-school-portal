import { useMutation } from "@tanstack/react-query";
import { SignInCredentials } from "../auth.definitions";
import { loginUser } from "../api/login";
import { storage } from "@/shared/libs/storage";

export const useLogin = () => {
  const { mutateAsync, isPending: isLoading } = useMutation({
    mutationKey: ["login"],
    mutationFn: (credentials: SignInCredentials) => loginUser(credentials),
  });

  const login = async (credentials: SignInCredentials) => {
    try {
      const result = await mutateAsync(credentials);
      const token = result?.data?.accessToken;
      if (!token) return { success: false, message: "Login failed" };
      storage.setToken(token);
      return { success: true, message: "Login successful" };
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        "Login failed";
      return { success: false, message };
    }
  };

  return { login, isLoading };
};
