import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CreditCard, Receipt, Lock } from "lucide-react";

export default function SuperuserDashboard() {
  const placeholderCards = [
    {
      title: "Restaurants",
      description: "Manage all registered restaurants",
      icon: Building2,
      status: "Coming soon",
    },
    {
      title: "Subscriptions",
      description: "Manage restaurant subscription plans",
      icon: Receipt,
      status: "Coming soon",
    },
    {
      title: "Payments",
      description: "View and manage payment history",
      icon: CreditCard,
      status: "Coming soon",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Superuser Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform administration and management
          </p>
        </div>

        {/* Access Notice */}
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 rounded-lg bg-warning/20">
              <Lock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-medium">Restricted Access</p>
              <p className="text-sm text-muted-foreground">
                This section is available to platform administrators only. Features are currently under development.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {placeholderCards.map((card) => (
            <Card key={card.title} className="relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {card.status}
                </span>
              </div>
              <CardHeader className="pb-2">
                <div className="p-3 rounded-lg bg-muted w-fit mb-3">
                  <card.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-24 rounded-lg bg-muted/50 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Feature not yet available</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>About Superuser Access</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              The superuser dashboard provides platform-wide administration capabilities for TurQR administrators.
            </p>
            <p>
              Once fully implemented, you'll be able to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Manage all registered restaurants on the platform</li>
              <li>Handle subscription plans and billing</li>
              <li>View payment history and generate reports</li>
              <li>Manage platform settings and configurations</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
