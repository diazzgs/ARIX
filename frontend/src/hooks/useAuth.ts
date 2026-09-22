import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import AuthService from "@/services/auth.service";
import { LoginRequest, RegisterRequest } from "@/types/auth";

export const useAuth = () => {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, logout: clearAuth, updateUser } = useAuthStore();

  const login = async (data: LoginRequest) => {
    const result = await AuthService.login(data);
    setAuth(result.user, result.access_token, result.refresh_token);
    redirectByRole(result.user.role.name);
  };

  const register = async (data: RegisterRequest) => {
    const result = await AuthService.register(data);
    setAuth(result.user, result.access_token, result.refresh_token);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  const redirectByRole = (role: string) => {
    switch (role) {
      case "ROLE_SUPER_ADMIN":
        router.push("/admin/dashboard");
        break;
      case "ROLE_STORE_ADMIN":
        router.push("/store/dashboard");
        break;
      default:
        router.push("/dashboard");
    }
  };

  return { user, isAuthenticated, login, register, logout, updateUser };
};