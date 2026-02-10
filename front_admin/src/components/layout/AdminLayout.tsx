import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { 
  LayoutDashboard, 
  FolderOpen, 
  UtensilsCrossed, 
  Shield, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/categories", label: "Categories", icon: FolderOpen },
  { path: "/admin/dishes", label: "Dishes", icon: UtensilsCrossed },
  { path: "/super", label: "Superuser", icon: Shield },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <img 
            src="/platform/Turlogo.png" 
            alt="TurQR Logo" 
            className="h-9 w-9 object-contain"
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-xl font-bold text-sidebar-primary-foreground">TurQR</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={cn(
                "sidebar-link",
                isActive(item.path, item.exact) && "sidebar-link-active"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border px-3 py-4">
          {user && (
            <p className="px-3 py-2 text-sm text-sidebar-foreground/60">
              Logged in as <span className="font-medium text-sidebar-foreground">{user.username}</span>
            </p>
          )}
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-left text-destructive/80 hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img 
              src="/platform/Turlogo.png" 
              alt="TurQR Logo" 
              className="h-8 w-8 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-lg font-bold text-sidebar-primary-foreground">TurQR</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="px-3 pb-4 space-y-1 border-t border-sidebar-border">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "sidebar-link",
                  isActive(item.path, item.exact) && "sidebar-link-active"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="sidebar-link w-full text-left text-destructive/80 hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 overflow-auto">
        <div className="p-6 lg:p-8 fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
