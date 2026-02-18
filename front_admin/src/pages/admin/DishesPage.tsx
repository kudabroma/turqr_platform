import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dishesApi, categoriesApi, Dish } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, UtensilsCrossed, AlertCircle, Filter } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";

interface DishForm {
  name: string;
  description: string;
  price: string;
  category: string;
}

const initialForm: DishForm = {
  name: "",
  description: "",
  price: "",
  category: "",
};

export default function DishesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const restaurantId = user?.restaurant ?? null;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDish, setEditDish] = useState<Dish | null>(null);
  const [deleteDish, setDeleteDish] = useState<Dish | null>(null);
  const [form, setForm] = useState<DishForm>(initialForm);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const dishesKey = ["dishes", restaurantId] as const;
  const categoriesKey = ["categories", restaurantId] as const;

  // Fetch dishes
  const { data: dishes = [], isLoading: dishesLoading, error: dishesError } = useQuery({
    queryKey: dishesKey,
    queryFn: dishesApi.list,
    enabled: !!restaurantId,
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: categoriesKey,
    queryFn: categoriesApi.list,
    enabled: !!restaurantId,
  });

  const isLoading = dishesLoading || categoriesLoading;

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<number, string>);
  }, [categories]);

  const filteredDishes = useMemo(() => {
    if (filterCategory === "all") return dishes;
    return dishes.filter((dish) => dish.category === parseInt(filterCategory));
  }, [dishes, filterCategory]);

  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    if (isNaN(numPrice)) return "0.00";
    return numPrice.toFixed(2);
  };

  const displayPrice = (price: string): string => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "0.00";
    return numPrice.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: DishForm) =>
      dishesApi.create({
        name: data.name,
        description: data.description,
        price: formatPrice(data.price),
        category: parseInt(data.category),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dishesKey });
      setIsCreateOpen(false);
      setForm(initialForm);
      toast.success("Dish created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create dish");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DishForm }) =>
      dishesApi.update(id, {
        name: data.name,
        description: data.description,
        price: formatPrice(data.price),
        category: parseInt(data.category),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dishesKey });
      setEditDish(null);
      setForm(initialForm);
      toast.success("Dish updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update dish");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => dishesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dishesKey });
      setDeleteDish(null);
      toast.success("Dish deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete dish");
    },
  });

  const handleCreate = () => {
    if (form.name.trim() && form.category) createMutation.mutate(form);
  };

  const handleUpdate = () => {
    if (editDish && form.name.trim() && form.category) {
      updateMutation.mutate({ id: editDish.id, data: form });
    }
  };

  const handleDelete = () => {
    if (deleteDish) deleteMutation.mutate(deleteDish.id);
  };

  const openEdit = (dish: Dish) => {
    setEditDish(dish);
    setForm({
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category.toString(),
    });
  };

  const openCreate = () => {
    setForm(initialForm);
    setIsCreateOpen(true);
  };

  if (!restaurantId) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No restaurant assigned to this account. Please contact support.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (dishesError) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dishes. Please try again later.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dishes</h1>
            <p className="text-muted-foreground mt-1">Manage your menu items</p>
          </div>
          <Button onClick={openCreate} disabled={categories.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dish
          </Button>
        </div>

        {/* Filter */}
        {categories.length > 0 && dishes.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* No categories warning */}
        {categories.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to create at least one category before adding dishes.{" "}
              <a href="/admin/categories" className="text-primary hover:underline font-medium">
                Create a category →
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* Dishes List */}
        {filteredDishes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {filterCategory !== "all" ? "No dishes in this category" : "No dishes yet"}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {filterCategory !== "all"
                  ? "Try selecting a different category"
                  : "Add your first dish to get started"}
              </p>
              {categories.length > 0 && filterCategory === "all" && (
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dish
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>
                {filteredDishes.length} {filteredDishes.length === 1 ? "dish" : "dishes"}
                {filterCategory !== "all" && ` in ${categoryMap[parseInt(filterCategory)]}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDishes.map((dish) => (
                      <tr key={dish.id}>
                        <td>
                          <div>
                            <p className="font-medium">{dish.name}</p>
                            {dish.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {dish.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                            {categoryMap[dish.category] || "Unknown"}
                          </span>
                        </td>
                        <td className="font-medium">${displayPrice(dish.price)}</td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(dish)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDish(dish)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editDish}
        onOpenChange={() => {
          setIsCreateOpen(false);
          setEditDish(null);
          setForm(initialForm);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editDish ? "Edit Dish" : "Add New Dish"}</DialogTitle>
            <DialogDescription>
              {editDish ? "Update the dish details" : "Fill in the details for your new menu item"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dish-name">Name *</Label>
              <Input
                id="dish-name"
                placeholder="e.g., Grilled Salmon"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dish-description">Description</Label>
              <Textarea
                id="dish-description"
                placeholder="Describe the dish..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dish-price">Price *</Label>
                <Input
                  id="dish-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dish-category">Category *</Label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                  <SelectTrigger id="dish-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditDish(null);
                setForm(initialForm);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editDish ? handleUpdate : handleCreate}
              disabled={
                !form.name.trim() ||
                !form.category ||
                (editDish ? updateMutation.isPending : createMutation.isPending)
              }
            >
              {(editDish ? updateMutation.isPending : createMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editDish ? "Saving..." : "Creating..."}
                </>
              ) : editDish ? (
                "Save Changes"
              ) : (
                "Add Dish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDish} onOpenChange={() => setDeleteDish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dish</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDish?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
