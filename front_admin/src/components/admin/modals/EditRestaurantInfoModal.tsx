import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { restaurantApi, type RestaurantMe } from "@/api/endpoints";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: RestaurantMe;
};

type FormState = Pick<RestaurantMe, "name" | "address" | "phone" | "email" | "contacts" | "logo">;

export function EditRestaurantInfoModal({ open, onOpenChange, restaurant }: Props) {
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>({
    name: "",
    address: "",
    phone: "",
    email: "",
    contacts: "",
    logo: "",
  });

  // when modal opens (or restaurant changes) — sync form with backend data
  useEffect(() => {
    if (!open) return;
    setForm({
      name: restaurant.name ?? "",
      address: restaurant.address ?? "",
      phone: restaurant.phone ?? "",
      email: restaurant.email ?? "",
      contacts: restaurant.contacts ?? "",
      logo: restaurant.logo ?? "",
    });
  }, [open, restaurant]);

  const update = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
  mutationFn: (payload: Partial<RestaurantMe>) => restaurantApi.update(payload),
  onSuccess: async () => {
    await qc.invalidateQueries({ queryKey: ["restaurant", "me"] });
    onOpenChange(false);
  },
});

  const handleSave = () => {
    mutation.mutate({
      name: form.name,
      address: form.address,
      phone: form.phone,
      email: form.email,
      contacts: form.contacts,
      logo: form.logo,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Restaurant Info</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="contacts">Description (optional)</Label>
            <Textarea
              id="contacts"
              value={form.contacts}
              onChange={(e) => update("contacts", e.target.value)}
              placeholder="Description"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="logo">Logo URL (optional)</Label>
            <Input
              id="logo"
              value={form.logo}
              onChange={(e) => update("logo", e.target.value)}
              placeholder="platform/Turlogo.png"
            />
          </div>

          {mutation.isError && (
            <div className="text-sm text-red-600">
              Failed to save: {(mutation.error as any)?.message ?? "Unknown error"}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
