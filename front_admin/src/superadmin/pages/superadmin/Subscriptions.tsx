import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSubscriptions, updateSubscription } from "@/api/superadmin";
import type { Subscription } from "@/types/superadmin";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active: "bg-accent text-accent-foreground",
  trial: "bg-primary/10 text-primary",
  inactive: "bg-muted text-muted-foreground",
};

export default function Subscriptions() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: subscriptions, isLoading } = useQuery({ queryKey: ["subscriptions"], queryFn: getSubscriptions });

  const [extendOpen, setExtendOpen] = useState(false);
  const [extendSub, setExtendSub] = useState<Subscription | null>(null);
  const [extendDate, setExtendDate] = useState<Date | undefined>();

  const mutation = useMutation({
    mutationFn: updateSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      toast({ title: "Subscription updated" });
      setExtendOpen(false);
    },
  });

  const setStatus = (id: number, status: Subscription["status"]) => {
    mutation.mutate({ id, status });
  };

  const handleExtend = () => {
    if (!extendSub || !extendDate) return;
    mutation.mutate({ id: extendSub.id, paid_until: format(extendDate, "yyyy-MM-dd") });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Subscriptions</h2>
        <p className="text-muted-foreground">Manage restaurant subscription plans and billing</p>
      </div>

      {/* Extend dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Extend Subscription — {extendSub?.restaurant}</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Current paid until: <span className="font-medium text-foreground">{extendSub?.paid_until ?? "N/A"}</span>
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !extendDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {extendDate ? format(extendDate, "PPP") : "Pick new date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={extendDate} onSelect={setExtendDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(false)}>Cancel</Button>
            <Button onClick={handleExtend} disabled={!extendDate || mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Paid Until</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !subscriptions?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No subscriptions</TableCell></TableRow>
            ) : (
              subscriptions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.restaurant}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[s.status]} variant="secondary">{s.status}</Badge>
                  </TableCell>
                  <TableCell>{s.plan}</TableCell>
                  <TableCell className="text-muted-foreground">{s.paid_until ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {s.status !== "trial" && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setStatus(s.id, "trial")}>
                          <Play className="mr-1 h-3.5 w-3.5" />Trial
                        </Button>
                      )}
                      {s.status !== "active" && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setStatus(s.id, "active")}>
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />Activate
                        </Button>
                      )}
                      {s.status !== "inactive" && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setStatus(s.id, "inactive")}>
                          <XCircle className="mr-1 h-3.5 w-3.5" />Deactivate
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => { setExtendSub(s); setExtendDate(s.paid_until ? new Date(s.paid_until) : undefined); setExtendOpen(true); }}
                      >
                        <CalendarIcon className="mr-1 h-3.5 w-3.5" />Extend
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
