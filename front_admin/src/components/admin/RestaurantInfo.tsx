import { MapPin, Phone, Mail, Pencil } from "lucide-react";
import { useState } from "react";
import { EditRestaurantInfoModal } from "./modals/EditRestaurantInfoModal";
import type { RestaurantMe } from "@/api/endpoints";

type Props = {
  restaurant: RestaurantMe;
};

export function RestaurantInfo({ restaurant }: Props) {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="px-4 mt-4 relative">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-foreground">{restaurant.name}</h1>
        <button
          onClick={() => setShowEditModal(true)}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          title="Edit Restaurant Info"
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-3">
        {restaurant.address ? (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="text-foreground">{restaurant.address}</span>
          </div>
        ) : null}

        {restaurant.phone ? (
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-primary shrink-0" />
            <span className="text-foreground">{restaurant.phone}</span>
          </div>
        ) : null}

        {restaurant.email ? (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-primary shrink-0" />
            <span className="text-foreground">{restaurant.email}</span>
          </div>
        ) : null}

        {restaurant.contacts ? (
          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {restaurant.contacts}
          </div>
        ) : null}
      </div>

      <EditRestaurantInfoModal open={showEditModal} onOpenChange={setShowEditModal} />
    </div>
  );
}
