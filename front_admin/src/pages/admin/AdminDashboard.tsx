import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/auth/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, UtensilsCrossed, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi, dishesApi } from "@/api/endpoints";

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const { data: dishes = [] } = useQuery({
    queryKey: ["dishes"],
    queryFn: dishesApi.list,
  });

  const stats = [
    {
      title: "Categories",
      value: categories.length,
      description: "Menu categories",
      icon: FolderOpen,
      href: "/admin/categories",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Dishes",
      value: dishes.length,
      description: "Total menu items",
      icon: UtensilsCrossed,
      href: "/admin/dishes",
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back{user?.username ? `, ${user.username}` : ""}! Here's an overview of your restaurant menu.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.title} to={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Manage Categories
              </CardTitle>
              <CardDescription>
                Create and organize menu categories for your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/admin/categories"
                className="inline-flex items-center text-primary hover:underline font-medium"
              >
                Go to Categories →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Manage Dishes
              </CardTitle>
              <CardDescription>
                Add, edit, and remove dishes from your menu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/admin/dishes"
                className="inline-flex items-center text-primary hover:underline font-medium"
              >
                Go to Dishes →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Keep your menu organized with clear category names</li>
              <li>• Update prices regularly to reflect current costs</li>
              <li>• Add detailed descriptions to help customers choose</li>
              <li>• Remove seasonal items when they're no longer available</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
