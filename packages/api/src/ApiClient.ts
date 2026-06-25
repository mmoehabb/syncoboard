import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

let globalApiToken: string | null = null;

export function setGlobalApiToken(token: string | null) {
  globalApiToken = token;
}

export abstract class ApiClient {
  protected client: AxiosInstance;

  constructor(baseURL: string = "/api") {
    // If not in browser and URL is relative, provide a default absolute base
    const isServer = typeof window === "undefined";
    const resolvedBaseURL =
      isServer && baseURL.startsWith("/")
        ? `${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost"}${baseURL}`
        : baseURL;

    this.client = axios.create({
      baseURL: resolvedBaseURL,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      if (globalApiToken) {
        config.headers.Authorization = `Bearer ${globalApiToken}`;
      }
      return config;
    });

    // We can add interceptors here if needed (e.g., for error handling)
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
      },
    );
  }

  protected async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  protected async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  protected async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  protected async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  protected async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }
}
