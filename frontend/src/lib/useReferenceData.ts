import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./useApiClient";
import type { Empresa } from "../types/empresa";
import type { AssignableUser } from "../types/user";

export function useEmpresas() {
  const api = useApiClient();
  return useQuery({
    queryKey: ["empresas-all"],
    queryFn: () => api.get("/api/v1/empresas?pageSize=100") as Promise<{ items: Empresa[] }>,
  });
}

export function useAssignableUsers() {
  const api = useApiClient();
  return useQuery({
    queryKey: ["users-assignable"],
    queryFn: () => api.get("/api/v1/auth/users") as Promise<AssignableUser[]>,
  });
}
