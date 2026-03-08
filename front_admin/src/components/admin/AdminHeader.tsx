import { useNavigate } from "react-router-dom";
import { LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";

type Props = {
  showBack?: boolean;
};

export function AdminHeader({ showBack }: Props) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: back + logo + title */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Geri">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/platform/Turlogo.png"
              alt="TurQR"
              className="h-8 w-auto object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Right: logout only (admin UI is TR-only) */}
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Çıkış">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}