import { Navigate } from "react-router-dom";
import { useSession } from "./useSession";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthed, isLoggedOut } = useSession();

  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>;

  if (isLoggedOut) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
