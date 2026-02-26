import { NavLink } from "react-router-dom";
import { LayoutDashboard, Store, Users, CreditCard, Receipt } from "lucide-react";

const links = [
  { to: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/superadmin/restaurants", label: "Restaurants", icon: Store },
  { to: "/superadmin/users", label: "Users", icon: Users },
  { to: "/superadmin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/superadmin/payments", label: "Payments", icon: Receipt },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">TurQR</h2>
        <p className="text-sm text-muted-foreground">Super Admin</p>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/superadmin"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`
              }
            >
              <Icon size={16} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}