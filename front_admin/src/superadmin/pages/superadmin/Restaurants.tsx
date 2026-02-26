import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRestaurants, createRestaurant } from "@/api/superadmin";
import type { CreateRestaurantPayload } from "@/types/superadmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, MoreHorizontal, ExternalLink, Copy, Loader2 } from "lucide-react";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Restaurants() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: restaurants, isLoading } = useQuery({ queryKey: ["restaurants"], queryFn: getRestaurants });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const mutation = useMutation({
    mutationFn: (data: CreateRestaurantPayload) => createRestaurant(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      setOpen(false);
      setName("");
      setSlug("");
      toast({ title: "Restaurant created", description: "The restaurant has been added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create restaurant.", variant: "destructive" });
    },
  });

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(slugify(v));
  };

  const handleSubmit = () => {
    if (!name.trim() || !slug.trim()) return;
    mutation.mutate({ name: name.trim(), slug: slug.trim() });
  };

  const copyLink = (s: string) => {
    // TODO: use production URL in prod
    const url = `https://${s}.turqr.com`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: url });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Restaurants</h2>
          <p className="text-muted-foreground">Manage all restaurants on the platform</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Restaurant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Restaurant</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Kebab Palace" />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="kebab-palace" />
                <p className="text-xs text-muted-foreground">Auto-generated from name. You can edit it.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={mutation.isPending || !name.trim() || !slug.trim()}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Paid Until</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !restaurants?.length ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No restaurants yet</TableCell></TableRow>
            ) : (
              restaurants.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.slug}</TableCell>
                  <TableCell>
                    <Badge variant={r.active ? "default" : "secondary"}>{r.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>{r.plan ?? "—"}</TableCell>
                  <TableCell>{r.paid_until ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.created_at}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(`/admin/restaurants/restaurant/${r.id}/change/`, "_blank")}>
                          <ExternalLink className="mr-2 h-4 w-4" />Open in Django Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyLink(r.slug)}>
                          <Copy className="mr-2 h-4 w-4" />Copy Public Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
