import { useQuery } from "@tanstack/react-query";
import { getRestaurants, getBusinessUsers, getSubscriptions, getPaymentHistory } from "@/superadmin/api/superadmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, CreditCard, Receipt, TrendingUp, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { data: restaurants } = useQuery({ queryKey: ["superadmin","restaurants"], queryFn: getRestaurants });
  const { data: users } = useQuery({ queryKey: ["superadmin","businessUsers"], queryFn: getBusinessUsers });
  const { data: subscriptions } = useQuery({ queryKey: ["superadmin","subscriptions"], queryFn: getSubscriptions });
  const { data: payments } = useQuery({ queryKey: ["superadmin","payments"], queryFn: getPaymentHistory });

  const activeRestaurants = restaurants?.filter((r) => r.active).length ?? 0;
  const totalRestaurants = restaurants?.length ?? 0;
  const activeUsers = users?.filter((u) => u.is_active).length ?? 0;
  const activeSubs = subscriptions?.filter((s) => s.status === "active").length ?? 0;
  const trialSubs = subscriptions?.filter((s) => s.status === "trial").length ?? 0;
  const totalRevenue = payments?.filter((p) => p.status === "success").reduce((a, p) => a + p.amount, 0) ?? 0;

  const stats = [
    { label: "Total Restaurants", value: totalRestaurants, sub: `${activeRestaurants} active`, icon: Store, color: "text-primary" },
    { label: "Business Users", value: users?.length ?? 0, sub: `${activeUsers} active`, icon: Users, color: "text-primary" },
    { label: "Active Subscriptions", value: activeSubs, sub: `${trialSubs} in trial`, icon: CreditCard, color: "text-primary" },
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, sub: `${payments?.length ?? 0} transactions`, icon: Receipt, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your TurQR platform</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments?.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{p.restaurant}</span>
                    <span className="text-muted-foreground ml-2">— ${p.amount}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === "success" ? "bg-accent text-accent-foreground" :
                    p.status === "failed" ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-primary" />
              Subscription Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions?.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.restaurant}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{s.plan}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.status === "active" ? "bg-accent text-accent-foreground" :
                      s.status === "trial" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
