import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

import LoginPage from "@/pages/login/LoginPage";
import CategoriesPage from "@/pages/admin/CategoriesPage";
import MenuPage from "@/pages/admin_studio/MenuPage";
import RestaurantPreview from "@/pages/admin_studio/RestaurantPreview";

import SuperuserDashboard from "@/pages/super/SuperuserDashboard";
import NotFound from "@/pages/NotFound";
import AccessDenied from "@/pages/AccessDenied";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isSuper = user?.restaurant === null;
  return <Navigate to={isSuper ? "/super" : "/admin"} replace />;
}

function LoginWrapper() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    const isSuper = user?.restaurant === null;
    return <Navigate to={isSuper ? "/super" : "/admin"} replace />;
  }

  return <LoginPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginWrapper />} />

            {/* ===== BUSINESS ===== */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="business">
                  <Navigate to="/admin/preview" replace />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/preview"
              element={
                <ProtectedRoute role="business">
                  <RestaurantPreview />
                </ProtectedRoute>
              }
            />

            {/* ✅ ЕДИНСТВЕННЫЙ путь для редактирования меню */}
            <Route
              path="/admin/menu"
              element={
                <ProtectedRoute role="business">
                  <MenuPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute role="business">
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />

            {/* ===== SUPERUSER ===== */}
            <Route
              path="/super"
              element={
                <ProtectedRoute role="superuser">
                  <SuperuserDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
