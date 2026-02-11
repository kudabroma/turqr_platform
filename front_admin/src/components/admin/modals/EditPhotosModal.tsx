import { useState } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EditPhotosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PhotoSlot {
  id: number;
  url: string | null;
}

const initialSlots: PhotoSlot[] = [
  { id: 1, url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop" },
  { id: 2, url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200&h=200&fit=crop" },
  { id: 3, url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop" },
  { id: 4, url: null },
  { id: 5, url: null },
  { id: 6, url: null },
];

export function EditPhotosModal({ open, onOpenChange }: EditPhotosModalProps) {
  const [slots, setSlots] = useState<PhotoSlot[]>(initialSlots);

  const handleRemove = (id: number) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, url: null } : s)));
  };

  const handleUpload = (id: number) => {
    // Placeholder: simulate upload
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, url: `https://picsum.photos/200?random=${id}` } : s
      )
    );
  };

  const handleSave = () => {
    console.log("Save photos:", slots);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Photos</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted relative overflow-hidden flex items-center justify-center"
            >
              {slot.url ? (
                <>
                  <img src={slot.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-foreground/0 hover:bg-foreground/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                    <button
                      onClick={() => handleUpload(slot.id)}
                      className="bg-background/90 rounded-full p-1.5"
                    >
                      <Upload className="h-3.5 w-3.5 text-foreground" />
                    </button>
                    <button
                      onClick={() => handleRemove(slot.id)}
                      className="bg-destructive/90 rounded-full p-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => handleUpload(slot.id)}
                  className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">Upload</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
