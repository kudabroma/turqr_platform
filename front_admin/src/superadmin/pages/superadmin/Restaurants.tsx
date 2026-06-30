import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRestaurant,
  deleteRestaurant,
  extendSubscription,
  getRestaurants,
  toggleRestaurantActive,
  updateRestaurantLanguages,
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
import { Calendar, ExternalLink, Globe, Link2, Plus, Trash2, UserCheck, UserX } from "lucide-react";

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ALL_LANGUAGES = [
  { code: "tr", flag: "🇹🇷", label: "Turkish" },
  { code: "ru", flag: "🇷🇺", label: "Russian" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "German" },
  { code: "no", flag: "🇳🇴", label: "Norwegian" },
  { code: "da", flag: "🇩🇰", label: "Danish" },
  { code: "sv", flag: "🇸🇪", label: "Swedish" },
  { code: "fi", flag: "🇫🇮", label: "Finnish" },
] as const;

const FLAG_MAP = Object.fromEntries(ALL_LANGUAGES.map((l) => [l.code, l.flag]));
const LANG_DISPLAY_MAX = 3;

function LanguageChips({ langs }: { langs: string[] }) {
  const shown = langs.slice(0, LANG_DISPLAY_MAX);
  const extra = langs.length - shown.length;
  return (
    <span className="inline-flex items-center gap-0.5 text-base leading-none">
      {shown.map((code) => (
        <span key={code} title={code.toUpperCase()}>
          {FLAG_MAP[code] ?? code.toUpperCase()}
        </span>
      ))}
      {extra > 0 && (
        <span className="ml-1 text-xs text-muted-foreground font-medium">+{extra}</span>
      )}
    </span>
  );
}

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

  const toggleMut = useMutation({
    mutationFn: (id: number) => toggleRestaurantActive(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["superadmin", "restaurants"] });
      toast({ title: "Restaurant status updated" });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to update status",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

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

  // ── Extend subscription ──────────────────────────────────────────────────
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<Restaurant | null>(null);
  const [extendDays, setExtendDays] = useState(30);

  const extendMut = useMutation({
    mutationFn: () => extendSubscription(extendTarget!.id, extendDays),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["superadmin", "restaurants"] });
      toast({ title: `Subscription extended by ${extendDays} days` });
      setExtendOpen(false);
      setExtendTarget(null);
      setExtendDays(30);
    },
    onError: (e: any) => {
      toast({
        title: "Failed to extend subscription",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });
  // ────────────────────────────────────────────────────────────────────────

  // ── Languages ────────────────────────────────────────────────────────────
  const [langOpen, setLangOpen] = useState(false);
  const [langTarget, setLangTarget] = useState<Restaurant | null>(null);
  const [langSelection, setLangSelection] = useState<string[]>(["tr", "ru", "en"]);

  const langMut = useMutation({
    mutationFn: () =>
      updateRestaurantLanguages(
        langTarget!.id,
        langSelection.includes("tr") ? langSelection : ["tr", ...langSelection]
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["superadmin", "restaurants"] });
      toast({ title: "Languages updated" });
      setLangOpen(false);
      setLangTarget(null);
    },
    onError: (e: any) => {
      toast({
        title: "Failed to update languages",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  function openLangModal(r: Restaurant) {
    setLangTarget(r);
    setLangSelection(r.enabled_languages?.length ? [...r.enabled_languages] : ["tr", "ru", "en"]);
    setLangOpen(true);
  }

  function toggleLang(code: string, checked: boolean) {
    if (code === "tr") return; // always on
    setLangSelection((prev) =>
      checked ? [...prev, code] : prev.filter((c) => c !== code)
    );
  }
  // ────────────────────────────────────────────────────────────────────────

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(toSlug(name));
    }
  }, [name, slugTouched]);

  useEffect(() => {
    if (!open) {
      setName("");
      setSlug("");
      setSlugTouched(false);
    }
  }, [open]);

  const onCreate = async () => {
    const cleanName = name.trim();
    const cleanSlug = normalizeSlug(slug);
    if (!cleanName || !cleanSlug) return;
    await createMut.mutateAsync({ name: cleanName, slug: cleanSlug });
    setName("");
    setSlug("");
    setSlugTouched(false);
    setOpen(false);
  };

  const copyLink = async (slug: string) => {
    const url = publicUrl(slug);
    await navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: url });
  };

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

  const canCreate = !!name.trim() && !!normalizeSlug(slug);

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
              <TableHead>Languages</TableHead>
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
                <TableCell>
                  <LanguageChips langs={r.enabled_languages ?? ["tr"]} />
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
                      variant="outline"
                      size="sm"
                      onClick={() => openLangModal(r)}
                      className="gap-2"
                    >
                      <Globe size={16} />
                      Languages
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExtendTarget(r);
                        setExtendDays(30);
                        setExtendOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Calendar size={16} />
                      Extend
                    </Button>

                    <Button
                      variant={r.active ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => toggleMut.mutate(r.id)}
                      className="gap-2"
                      disabled={toggleMut.isPending}
                      title={r.active ? "Disable restaurant" : "Enable restaurant"}
                    >
                      {r.active ? <UserX size={16} /> : <UserCheck size={16} />}
                      {r.active ? "Disable" : "Enable"}
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
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(normalizeSlug(e.target.value));
                }}
                placeholder="turko"
              />
              <p className="text-xs text-muted-foreground">
                Public URL: {slug ? publicUrl(slug) : "—"}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={!canCreate || createMut.isPending}>
              {createMut.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(v) => {
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
              DEV note: later you'll use "disable restaurant" (active=false) instead of deleting.
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

      {/* EXTEND SUBSCRIPTION */}
      <Dialog
        open={extendOpen}
        onOpenChange={(v) => {
          if (extendMut.isPending) return;
          setExtendOpen(v);
          if (!v) setExtendTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Extend subscription</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-sm font-medium">{extendTarget?.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                Current paid until:{" "}
                <span className="font-semibold text-foreground">
                  {extendTarget?.paid_until ?? "not set"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Days to extend</Label>
              <div className="flex gap-2">
                {[7, 30, 90, 365].map((d) => (
                  <Button
                    key={d}
                    variant={extendDays === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExtendDays(d)}
                  >
                    {d}d
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExtendOpen(false);
                setExtendTarget(null);
              }}
              disabled={extendMut.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => extendMut.mutate()}
              disabled={extendMut.isPending || extendDays < 1}
            >
              {extendMut.isPending ? "Extending..." : `Extend ${extendDays} days`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LANGUAGES */}
      <Dialog
        open={langOpen}
        onOpenChange={(v) => {
          if (langMut.isPending) return;
          setLangOpen(v);
          if (!v) setLangTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Languages — {langTarget?.name ?? "—"}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Choose which languages appear in the public menu switcher.
            Turkish is always enabled.
          </p>

          <div className="grid grid-cols-2 gap-3 py-2">
            {ALL_LANGUAGES.map(({ code, flag, label }) => {
              const isForced = code === "tr";
              const checked = isForced || langSelection.includes(code);
              return (
                <label
                  key={code}
                  className={[
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer select-none transition-colors",
                    checked && !isForced
                      ? "border-primary bg-primary/5"
                      : isForced
                      ? "border-border bg-muted/40 opacity-70 cursor-not-allowed"
                      : "border-border hover:bg-muted/30",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="accent-primary w-4 h-4 shrink-0"
                    checked={checked}
                    disabled={isForced}
                    onChange={(e) => toggleLang(code, e.target.checked)}
                  />
                  <span className="text-base leading-none">{flag}</span>
                  <span className="text-sm font-medium">{label}</span>
                </label>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLangOpen(false);
                setLangTarget(null);
              }}
              disabled={langMut.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => langMut.mutate()}
              disabled={langMut.isPending}
            >
              {langMut.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}