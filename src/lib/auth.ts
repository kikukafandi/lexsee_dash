// src/lib/auth.ts
// Authentication utilities for the Lexsee Admin Dashboard.
// Manages the JWT token in localStorage and provides a profile-fetch helper.

import { apiFetch } from "./api";
import type { User, LoginResponse } from "@/types";

// The key used to store the JWT in localStorage
const TOKEN_KEY = "lexsee_admin_token";

/** Read the JWT from localStorage. Returns null if not logged in. */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Save the JWT to localStorage after a successful login. */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Remove the JWT from localStorage (logout). */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Returns true if a token is currently stored. */
export function isLoggedIn(): boolean {
  return !!getToken();
}

/**
 * Log in with email and password.
 * On success, saves the token to localStorage and returns the user + token.
 * Throws if credentials are wrong or network fails.
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // The backend may return either "token" or "access_token" depending on version
  const token = data.token ?? data.access_token ?? "";
  setToken(token);

  return data;
}

/**
 * Fetch the profile of the currently logged-in user.
 * Uses the token stored in localStorage.
 * Throws if the token is invalid or expired.
 */
export async function getProfile(): Promise<User> {
  return apiFetch<User>("/api/profile");
}

/** Log out: remove the token from localStorage. */
export function logout(): void {
  removeToken();
}
