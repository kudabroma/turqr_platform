import { useQuery } from "@tanstack/react-query";
import { authApi, type User } from "@/api/endpoints";
import { getAccessToken } from "@/api/apiClient";

export function useSession() {
  const q = useQuery<User>({
    queryKey: ["session", "me"],
    queryFn: authApi.me,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,        // ✅ кэш никогда не устаревает сам по себе
    gcTime: Infinity,           // ✅ не выбрасывать из памяти
    enabled: !!getAccessToken(), // ✅ вообще не делать запрос если токена нет
  });

  const status = (q.error as any)?.status;
  const isLoggedOut = q.isError && (status === 401 || status === 403);

  return {
    ...q,
    user: q.data ?? null,
    isAuthed: q.isSuccess,
    isLoggedOut,
  };
}