import { categoriesApi } from "@/api/endpoints";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Должно совпадать с AuthUser в AuthContext
export type SessionUser = {
  id: number;
  username: string;
  restaurant: number | null;
};

export function useSession() {
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["session", "categories_probe"],
    queryFn: () => categoriesApi.list(),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const status = (q.error as any)?.status;
  const isLoggedOut = q.isError && (status === 401 || status === 403);

  // ✅ user берём из кэша (его положим туда после login)
  const user = queryClient.getQueryData<SessionUser>(["session", "user"]) ?? null;

  return { ...q, isAuthed: q.isSuccess, isLoggedOut, user };
}
