import { User } from "@repo/schema";

export interface AuthState {
  isAuthenticated: boolean | null;
  user: User | null;
}
