import { useState } from "react";
import { MapPin, Clock, Phone, Mail, Star, Pencil } from "lucide-react";
import { EditRestaurantInfoModal } from "./modals/EditRestaurantInfoModal";

const mockData = {
  name: "TurkoKebabHouse",
  rating: 4.8,
  reviews: 127,
  address: "Istanbul, Blue Mosque",
  hours: "10:00 - 22:00",
  isOpen: true,
  phone: "+77009654753",
  email: "Turkokebabhouse@gmail.com",
  description: "",
};

export function RestaurantInfo() {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="px-4 mt-4 relative">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-foreground">{mockData.name}</h1>
        <button
          onClick={() => setShowEditModal(true)}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          title="Edit Restaurant Info"
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mt-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-4 w-4 ${s <= Math.round(mockData.rating) ? "fill-primary text-primary" : "text-border"}`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {mockData.rating} ({mockData.reviews} reviews)
        </span>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="text-foreground">{mockData.address}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <span className="text-foreground">{mockData.hours}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[hsl(145,60%,42%)] text-[hsl(0,0%,100%)]">
            {mockData.isOpen ? "Open Now" : "Closed"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Phone className="h-4 w-4 text-primary shrink-0" />
          <span className="text-foreground">{mockData.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Mail className="h-4 w-4 text-primary shrink-0" />
          <span className="text-foreground">{mockData.email}</span>
        </div>
      </div>

      <EditRestaurantInfoModal open={showEditModal} onOpenChange={setShowEditModal} />
    </div>
  );
}
