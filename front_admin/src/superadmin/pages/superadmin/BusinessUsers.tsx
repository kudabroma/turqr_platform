import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBusinessUsers,
  createBusinessUser,
  getRestaurants,
  resetBusinessUserPassword,
  toggleBusinessUserActive,
  generatePassword,
} from "@/superadmin/api/superadmin";
import type { CreateBusinessUserPayload } from "@/superadmin/types/superadmin";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  MoreHorizontal,
  ExternalLink,
  KeyRound,
  Wand2,
  Loader2,
  UserCheck,
  UserX,
} from "lucide-react";

type RestaurantMini = { id: number; name: string; slug: string };

type BusinessUser = {
  id: number;
  email?: string;
  display_email?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  date_joined?: string; // backend field
  last_login?: string | null;
  restaurant: RestaurantMini | null;
};

function formatDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
}

export default function BusinessUsers() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // ✅ IMPORTANT:
  // Using queryFn wrapped in an arrow to guarantee it runs and to make debugging easier.
  const {
    data: usersRaw,
    isLoading: usersLoading,
    isError: usersIsError,
    error: usersError,
  } = useQuery({
    queryKey: ["superadmin", "users"],
    queryFn: () => getBusinessUsers(),
  });

  const {
    data: restaurants,
    isLoading: restaurantsLoading,
    isError: restaurantsIsError,
    error: restaurantsError,
  } = useQuery({
    queryKey: ["superadmin", "restaurants"],
    queryFn: () => getRestaurants(),
  });

  // Normalize users (backend returns email/display_email + restaurant object + date_joined)
  const users: BusinessUser[] = useMemo(() => {
    const arr = Array.isArray(usersRaw) ? usersRaw : [];
    return arr.map((u: any) => ({
      id: u.id,
      email: u.email ?? "",
      display_email: u.display_email ?? "",
      first_name: u.first_name ?? "",
      last_name: u.last_name ?? "",
      is_active: !!u.is_active,
      date_joined: u.date_joined ?? u.created_at ?? null,
      last_login: u.last_login ?? null,
      restaurant: u.restaurant ?? null,
    }));
  }, [usersRaw]);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [password, setPassword] = useState("");
  const [sendLater, setSendLater] = useState(false);

  // Reset password modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: CreateBusinessUserPayload) => createBusinessUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "users"] });
      setCreateOpen(false);
      setUsernameOrEmail("");
      setRestaurantId("");
      setPassword("");
      toast({ title: "User created successfully" });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to create user",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetBusinessUserPassword(resetUserId!, newPassword),
    onSuccess: () => {
      setResetOpen(false);
      setNewPassword("");
      toast({ title: "Password reset successfully" });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to reset password",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleBusinessUserActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin", "users"] }),
    onError: (e: any) => {
      toast({
        title: "Failed to update user",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!usernameOrEmail.trim() || !restaurantId || (!sendLater && password.length < 8)) return;

    // Backend create serializer may expect either "email" or "username".
    // We send both to be robust; backend can ignore one.
    createMutation.mutate({
      username: usernameOrEmail.trim(),
      email: usernameOrEmail.trim(),
      restaurant_id: Number(restaurantId),
      password: sendLater ? generatePassword() : password,
    } as any);
  };

  const topError =
    (usersIsError ? String((usersError as any)?.message || usersError) : null) ||
    (restaurantsIsError ? String((restaurantsError as any)?.message || restaurantsError) : null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Users</h2>
          <p className="text-muted-foreground">Manage restaurant owner accounts</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Business User</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Username / Email *</Label>
                <Input
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="user@restaurant.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Restaurant *</Label>
                <Select value={restaurantId} onValueChange={setRestaurantId}>
                  <SelectTrigger>
                    <SelectValue placeholder={restaurantsLoading ? "Loading..." : "Select restaurant"} />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants?.map((r: any) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Password{" "}
                  <span className="text-xs text-muted-foreground">(min 8 characters)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={sendLater}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPassword(generatePassword())}
                    disabled={sendLater}
                  >
                    <Wand2 className="mr-1 h-3.5 w-3.5" />
                    Generate
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="sendLater"
                  checked={sendLater}
                  onCheckedChange={(v) => setSendLater(!!v)}
                />
                <Label htmlFor="sendLater" className="text-sm font-normal">
                  Send password later
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createMutation.isPending ||
                  !usernameOrEmail.trim() ||
                  !restaurantId ||
                  (!sendLater && password.length < 8)
                }
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>
                New Password *{" "}
                <span className="text-xs text-muted-foreground">(min 8 characters)</span>
              </Label>
              <div className="flex gap-2">
                <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPassword(generatePassword())}
                >
                  <Wand2 className="mr-1 h-3.5 w-3.5" />
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending || newPassword.length < 8 || !resetUserId}
            >
              {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {topError && (
        <div className="rounded-lg border bg-card p-4 text-sm">
          <div className="font-semibold text-destructive">API error</div>
          <div className="text-muted-foreground">{topError}</div>
          <div className="text-muted-foreground mt-2">
            Tip: open DevTools → Network → Fetch/XHR and check /api/superadmin/users/
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Username / Email</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {usersLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users yet
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.id}</TableCell>

                  <TableCell className="font-medium">
                    {u.display_email || u.email || `user#${u.id}`}
                  </TableCell>

                  <TableCell>
                    {typeof u.restaurant === "string" ? u.restaurant : (u.restaurant?.name ?? "—")}
                  </TableCell>

                  <TableCell>
                    <Badge variant={u.is_active ? "default" : "secondary"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(u.date_joined)}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setResetUserId(u.id);
                            setResetOpen(true);
                          }}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => toggleMutation.mutate(u.id)}>
                          {u.is_active ? (
                            <UserX className="mr-2 h-4 w-4" />
                          ) : (
                            <UserCheck className="mr-2 h-4 w-4" />
                          )}
                          {u.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => window.open(`/admin/auth/user/${u.id}/change/`, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in Django Admin
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