// src/infrastructure/http/api.ts
import axios, { AxiosError } from "axios";

const BASE_URL = "http://localhost:5137/api"; 

const create = () => {
  const i = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });

  i.interceptors.response.use(
    (r) => r,
    (e: AxiosError<any>) => {
      if (e.response) {
        const d: any = e.response.data;
        return Promise.reject(new Error(d?.message || `Request failed with status code ${e.response.status}`));
      }
      if (e.request) return Promise.reject(new Error("Network Error"));
      return Promise.reject(new Error((e as any).message || "Request Error"));
    }
  );
  return i;
};

export const api = create();       // autenticada (para endpoints protegidos)
export const apiPublic = create(); // pública (para register/login)

export const setAuthToken = (token?: string | null) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};
export const clearAuthToken = () => delete api.defaults.headers.common.Authorization;
