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

// ✅ убрали logo
type FormState = Pick<
  RestaurantMe,
  "name" | "address" | "phone" | "email" | "contacts"
>;

export function EditRestaurantInfoModal({ open, onOpenChange, restaurant }: Props) {
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>({
    name: "",
    address: "",
    phone: "",
    email: "",
    contacts: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: restaurant.name ?? "",
      address: restaurant.address ?? "",
      phone: restaurant.phone ?? "",
      email: restaurant.email ?? "",
      contacts: restaurant.contacts ?? "",
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
      // ✅ logo НЕ отправляем
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

          {/* ✅ Logo input removed for now */}

          {mutation.isError && (
            <div className="text-sm text-red-600">
              Failed to save:{" "}
              {(() => {
                const err: any = mutation.error;
                // если apiClient кладёт ответ в err.data — покажем его
                if (err?.data) return JSON.stringify(err.data);
                return err?.message ?? "Unknown error";
              })()}
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