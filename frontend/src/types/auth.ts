export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  profile_image_url: string;
  status: string;
  email_verified: boolean;
  role: {
    id: number;
    name: "ROLE_CLIENT" | "ROLE_STORE_ADMIN" | "ROLE_SUPER_ADMIN";
  };
  created_at: string;
}
