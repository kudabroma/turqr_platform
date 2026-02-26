import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRestaurant,
  deleteRestaurant,
  getRestaurants,
} from "@/superadmin/api/superadmin";
import type { CreateRestaurantPayload, Restaurant } from "@/superadmin/types/superadmin";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Пока ты в dev: можно так. Потом заменишь на https://{slug}.turqr.com
function publicUrl(slug: string) {
  return `http://${slug}.localhost:8080`;
}

function planBadge(plan: Restaurant["plan"]) {
  if (!plan) return <Badge variant="secondary">none</Badge>;
  if (plan === "trial") return <Badge variant="outline">trial</Badge>;
  if (plan === "basic") return <Badge variant="secondary">basic</Badge>;
  return <Badge>premium</Badge>;
}

export default function RestaurantsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ["superadmin", "restaurants"],
    queryFn: getRestaurants,
  });

  // CREATE
  const createMut = useMutation({
    mutationFn: (payload: CreateRestaurantPayload) => createRestaurant(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["superadmin", "restaurants"] });
      toast({ title: "Restaurant created" });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to create restaurant",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  // DELETE (hard delete)
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteRestaurant(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["superadmin", "restaurants"] });
      toast({ title: "Restaurant deleted" });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to delete restaurant",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Create modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const slug = useMemo(() => toSlug(name), [name]);

  // Delete confirm modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);

  const onCreate = async () => {
    if (!name.trim() || !slug) return;
    await createMut.mutateAsync({ name: name.trim(), slug });
    setName("");
    setOpen(false);
  };

  const copyLink = async (slug: string) => {
    const url = publicUrl(slug);
    await navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: url });
  };

  // Подстрой если у тебя другой url для Django admin:
  const openDjangoAdmin = (id: number) => {
    window.open(`/admin/restaurants/restaurant/${id}/change/`, "_blank");
  };

  const askDelete = (r: Restaurant) => {
    setDeleteTarget(r);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMut.mutateAsync(deleteTarget.id);
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  if (isLoading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Restaurants</h1>
          <p className="text-sm text-muted-foreground">
            Create restaurants and manage platform-level status.
          </p>
        </div>

        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus size={16} />
          Create restaurant
        </Button>
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="p-4 border-b text-sm text-muted-foreground">
          {restaurants?.length ?? 0} restaurants
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Paid until</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {restaurants?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.slug}</TableCell>
                <TableCell>
                  {r.active ? (
                    <Badge variant="secondary">active</Badge>
                  ) : (
                    <Badge variant="destructive">inactive</Badge>
                  )}
                </TableCell>
                <TableCell>{planBadge(r.plan)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {r.paid_until ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(r.slug)}
                      className="gap-2"
                    >
                      <Link2 size={16} />
                      Copy link
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(publicUrl(r.slug), "_blank")}
                      className="gap-2"
                    >
                      <ExternalLink size={16} />
                      Open
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDjangoAdmin(r.id)}
                      className="gap-2"
                    >
                      <ExternalLink size={16} />
                      Django admin
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => askDelete(r)}
                      className="gap-2"
                      disabled={deleteMut.isPending}
                      title="Hard delete (DEV only)"
                    >
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* CREATE */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create restaurant</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Turko Kebap House"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug (auto)</Label>
              <Input value={slug} readOnly />
              <p className="text-xs text-muted-foreground">
                Public URL: {slug ? publicUrl(slug) : "—"}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={!name.trim() || createMut.isPending}>
              {createMut.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(v) => {
          // не даём закрыть во время запроса
          if (deleteMut.isPending) return;
          setDeleteOpen(v);
          if (!v) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete restaurant</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm">
              You are about to <span className="font-semibold">permanently delete</span>{" "}
              this restaurant:
            </p>

            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-sm font-medium">{deleteTarget?.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                slug: {deleteTarget?.slug ?? "—"} • id: {deleteTarget?.id ?? "—"}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              DEV note: later you’ll use “disable restaurant” (active=false) instead of
              deleting.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteTarget(null);
              }}
              disabled={deleteMut.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!deleteTarget || deleteMut.isPending}
            >
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}