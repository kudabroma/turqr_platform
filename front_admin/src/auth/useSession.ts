import { useQuery } from "@tanstack/react-query";
import { authApi, type User } from "@/api/endpoints";

export function useSession() {
  const q = useQuery<User>({
    queryKey: ["session", "me"],
    queryFn: authApi.me,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
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
