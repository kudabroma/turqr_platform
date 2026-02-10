import { Navigate } from "react-router-dom";
import { useSession } from "@/auth/useSession";

export default function RootRedirect() {
  const { isLoading, isAuthed, isLoggedOut } = useSession();

  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>;

  if (isAuthed) return <Navigate to="/admin" replace />;
  if (isLoggedOut) return <Navigate to="/login" replace />;

  return <Navigate to="/login" replace />;
}
