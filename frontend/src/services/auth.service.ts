import api from "@/lib/api";
import { LoginRequest, RegisterRequest, TokenResponse } from "@/types/auth";

const AuthService = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data.data;
  },

  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email });
  },

  resetPassword: async (token: string, new_password: string): Promise<void> => {
    await api.post("/auth/reset-password", { token, new_password });
  },
};

export default AuthService;
