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

type Lang = "tr" | "en";

type FormState = {
  name: string;
  address: string;
  phone: string;
  email: string;
  contacts: string;
  working_hours: string;
  description_tr: string;
  description_en: string;
};

export function EditRestaurantInfoModal({
  open,
  onOpenChange,
  restaurant,
}: Props) {
  const qc = useQueryClient();
  const [activeLang, setActiveLang] = useState<Lang>("tr");

  const [form, setForm] = useState<FormState>({
    name: "",
    address: "",
    phone: "",
    email: "",
    contacts: "",
    working_hours: "",
    description_tr: "",
    description_en: "",
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      name: restaurant.name ?? "",
      address: restaurant.address ?? "",
      phone: restaurant.phone ?? "",
      email: restaurant.email ?? "",
      contacts: restaurant.contacts ?? "",
      working_hours: (restaurant as any).working_hours ?? "",
      description_tr: (restaurant as any).description_tr ?? "",
      description_en: (restaurant as any).description_en ?? "",
    });

    setActiveLang("tr");
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
      working_hours: form.working_hours,
      description_tr: form.description_tr,
      description_en: form.description_en,
    } as Partial<RestaurantMe>);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Restoran Bilgilerini Düzenle</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-132px)]">
          <div className="space-y-4 mt-2">
            <div>
              <Label>İsim</Label>
              <Input
                value={form.name}
                maxLength={100}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>

            <div>
              <Label>Adres</Label>
              <Input
                value={form.address}
                maxLength={200}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>

            <div>
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                maxLength={20}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <div>
              <Label>E-posta</Label>
              <Input
                value={form.email}
                maxLength={100}
                type="email"
                onChange={(e) => update("email", e.target.value)}
              />
            </div>

            <div>
              <Label>Çalışma Saatleri</Label>
              <Input
                value={form.working_hours}
                maxLength={50}
                onChange={(e) => update("working_hours", e.target.value)}
                placeholder="09:00 - 23:00"
              />
            </div>

            <div>
              <Label>Açıklama</Label>

              <div className="flex gap-2 mt-2 mb-2">
                <button
                  type="button"
                  onClick={() => setActiveLang("tr")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeLang === "tr"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  TR
                </button>

                <button
                  type="button"
                  onClick={() => setActiveLang("en")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeLang === "en"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  EN
                </button>
              </div>

              {activeLang === "tr" ? (
                <Textarea
                  value={form.description_tr}
                  maxLength={1000}
                  onChange={(e) => update("description_tr", e.target.value)}
                  placeholder="Restoran açıklaması (Türkçe)"
                  rows={4}
                />
              ) : (
                <Textarea
                  value={form.description_en}
                  maxLength={1000}
                  onChange={(e) => update("description_en", e.target.value)}
                  placeholder="Restoran açıklaması (İngilizce)"
                  rows={4}
                />
              )}
            </div>

            <div>
              <Label>Ek İletişim Bilgileri (isteğe bağlı)</Label>
              <Textarea
                value={form.contacts}
                maxLength={500}
                onChange={(e) => update("contacts", e.target.value)}
                rows={3}
              />
            </div>

            {mutation.isError && (
              <div className="text-sm text-red-600">Kaydedilemedi.</div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-background sticky bottom-0 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            İptal
          </Button>

          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}