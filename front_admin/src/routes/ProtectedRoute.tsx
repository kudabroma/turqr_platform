import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Loader2 } from "lucide-react";

type Role = "business" | "superuser";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: Role; // 👈 новый проп
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
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

  // ✅ role check (строго)
  const isSuper = user?.restaurant === null;
  const isBusiness = !!user && user.restaurant !== null;

  if (role === "superuser" && !isSuper) {
    return <Navigate to="/admin" replace />;
  }

  if (role === "business" && !isBusiness) {
    return <Navigate to="/super" replace />;
  }

  return <>{children}</>;
}
