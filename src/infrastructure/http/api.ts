// src/infrastructure/http/api.ts
import axios, { AxiosError } from "axios";

const BASE_URL =
  "https://pymefiel-back-qa-f8g8dgeef7cjg5gd.canadacentral-01.azurewebsites.net/api";

// ------------------------------------------------------
// 🟦 Handler global para manejar 401 (logout global)
// ------------------------------------------------------
let onUnauthorized: (() => void) | null = null;

export const setOnUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

// ------------------------------------------------------
// 🟦 Crea instancia de axios
// ------------------------------------------------------
const create = () => {
  const i = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // ------------------------------------------------------
  // 🟥 Interceptor de errores
  // ------------------------------------------------------
  i.interceptors.response.use(
    (response) => response,
    (error: AxiosError<any>) => {
      if (error.response) {
        const d: any = error.response.data;

        // ⚠️ Si backend manda 401
        if (error.response.status === 401) {
          // Limpia token
          clearAuthToken();

          // Ejecuta logout global si está configurado
          if (onUnauthorized) onUnauthorized();

          return Promise.reject(
            new Error("Token expirado, favor de hacer login nuevamente.")
          );
        }

        return Promise.reject(
          new Error(
            d?.message || `Request failed with status code ${error.response.status}`
          )
        );
      }

      if (error.request) {
        return Promise.reject(new Error("Network Error"));
      }

      return Promise.reject(new Error(error.message || "Request Error"));
    }
  );

  return i;
};

// ------------------------------------------------------
// 🟦 Instancias pública y privada
// ------------------------------------------------------
export const api = create();       // autenticada
export const apiPublic = create(); // no autenticada

// ------------------------------------------------------
// 🟦 Manejo del token
// ------------------------------------------------------
export const setAuthToken = (token?: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const clearAuthToken = () => {
  delete api.defaults.headers.common["Authorization"];
};
