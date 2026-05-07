import { useState } from "react";

export type SelectedDish = {
  id: string;
  name: string;
  name_tr: string;  // ← добавить
  price: number;
  quantity: number;
};

export function useSelection() {
  const [selected, setSelected] = useState<SelectedDish[]>([]);

    const add = (dish: { id: string; name: string; name_tr: string; price: number }) => {
    setSelected(prev => {
      const existing = prev.find(d => d.id === dish.id);
      if (existing) {
        return prev.map(d => d.id === dish.id ? { ...d, quantity: d.quantity + 1 } : d);
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const remove = (id: string) => {
    setSelected(prev => {
      const existing = prev.find(d => d.id === id);
      if (existing?.quantity === 1) return prev.filter(d => d.id !== id);
      return prev.map(d => d.id === id ? { ...d, quantity: d.quantity - 1 } : d);
    });
  };

  const clear = () => setSelected([]);

  const total = selected.reduce((sum, d) => sum + d.price * d.quantity, 0);
  const count = selected.reduce((sum, d) => sum + d.quantity, 0);

  return { selected, add, remove, clear, total, count };
}