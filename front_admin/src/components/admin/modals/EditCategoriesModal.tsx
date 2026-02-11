import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  onSave: (categories: string[]) => void;
}

export function EditCategoriesModal({ open, onOpenChange, categories, onSave }: EditCategoriesModalProps) {
  const [items, setItems] = useState<string[]>(categories);

  const handleRename = (index: number, value: string) => {
    setItems((prev) => prev.map((c, i) => (i === index ? value : c)));
  };

  const handleAdd = () => {
    setItems((prev) => [...prev, "New Category"]);
  };

  const handleDelete = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(items.filter((c) => c.trim()));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
          {items.map((cat, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={cat}
                onChange={(e) => handleRename(i, e.target.value)}
                className="flex-1"
              />
              <button
                onClick={() => handleDelete(i)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={handleAdd} className="w-full mt-2">
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
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
