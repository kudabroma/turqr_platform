import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPaymentHistory, getRestaurants } from "@/superadmin/api/superadmin";
import type { Payment } from "@/superadmin/types/superadmin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  success: "bg-accent text-accent-foreground",
  pending: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
  refund: "bg-muted text-muted-foreground",
};

export default function Payments() {
  const { data: payments, isLoading } = useQuery({ queryKey: ["superadmin", "payments"], queryFn: getPaymentHistory });
  const { data: restaurants } = useQuery({ queryKey: ["superadmin","restaurants"], queryFn: getRestaurants });

  const [filterRestaurant, setFilterRestaurant] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p) => {
      if (filterRestaurant !== "all" && p.restaurant !== filterRestaurant) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      return true;
    });
  }, [payments, filterRestaurant, filterStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payment History</h2>
        <p className="text-muted-foreground">Track all payment transactions</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterRestaurant} onValueChange={setFilterRestaurant}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Restaurant" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Restaurants</SelectItem>
            {restaurants?.map((r) => (
              <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !filtered.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.restaurant}</TableCell>
                  <TableCell>${p.amount.toFixed(2)}</TableCell>
                  <TableCell className="uppercase text-xs">{p.currency}</TableCell>
                  <TableCell className="capitalize">{p.provider}</TableCell>
                  <TableCell>
                    <Badge className={statusStyles[p.status]} variant="secondary">{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.created_at}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
