import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Loader2 } from "lucide-react";

type Role = "business" | "superuser";

export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // ждём и /me тоже
  const userReady = !!user;

  if (isLoading || (isAuthenticated && !userReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isSuper = user!.restaurant === null;
  const isBusiness = user!.restaurant !== null;

  if (role === "superuser" && !isSuper) return <Navigate to="/admin" replace />;
  if (role === "business" && !isBusiness) return <Navigate to="/super" replace />;

  return <>{children}</>;
}
