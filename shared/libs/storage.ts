const storagePrefix = "sp__";

export const storage = {
  getToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(`${storagePrefix}token`);
  },
  setToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`${storagePrefix}token`, token);
  },
  removeToken: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${storagePrefix}token`);
  },
};
