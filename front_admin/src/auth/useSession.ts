import { categoriesApi } from "@/api/endpoints";
import { useQuery } from "@tanstack/react-query";

export function useSession() {
  const q = useQuery({
    queryKey: ["session", "categories_probe"],
    queryFn: () => categoriesApi.list(),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const status = (q.error as any)?.status;
  const isLoggedOut = q.isError && (status === 401 || status === 403);

  return { ...q, isAuthed: q.isSuccess, isLoggedOut };
}
