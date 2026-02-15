"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { categories as initialCategories } from "@/data/categories";
import { toast } from "sonner";
import { Category } from "@/types";

export default function AdminCategoriesPage() {
  const [categoryList, setCategoryList] = useState(initialCategories);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "", image: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newCategory.name) {
      toast.error("Please enter a category name");
      return;
    }
    const cat: Category = {
      id: `cat-${Date.now()}`,
      name: newCategory.name,
      slug: newCategory.name.toLowerCase().replace(/\s+/g, "-"),
      description: newCategory.description,
      image: newCategory.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
      productCount: 0,
    };
    setCategoryList((prev) => [...prev, cat]);
    setNewCategory({ name: "", description: "", image: "" });
    setAddOpen(false);
    toast.success("Category added");
  };

  const handleDelete = (id: string) => {
    setCategoryList((prev) => prev.filter((c) => c.id !== id));
    setDeleteId(null);
    toast.success("Category deleted");
  };

  const handleUpdate = () => {
    if (!editCategory) return;
    setCategoryList((prev) =>
      prev.map((c) => (c.id === editCategory.id ? editCategory : c))
    );
    setEditCategory(null);
    toast.success("Category updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage product categories and brands
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Vivo"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Short description"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={newCategory.image}
                  onChange={(e) => setNewCategory({ ...newCategory, image: e.target.value })}
                  placeholder="https://..."
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryList.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border bg-card overflow-hidden"
          >
            <div className="relative h-32 bg-muted">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{category.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {category.productCount} products
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {category.description}
              </p>
              <div className="flex gap-2">
                <Dialog
                  open={editCategory?.id === category.id}
                  onOpenChange={(open) => !open && setEditCategory(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-lg"
                      onClick={() => setEditCategory({ ...category })}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    {editCategory && (
                      <div className="space-y-4 mt-2">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={editCategory.name}
                            onChange={(e) =>
                              setEditCategory({ ...editCategory, name: e.target.value })
                            }
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={editCategory.description}
                            onChange={(e) =>
                              setEditCategory({ ...editCategory, description: e.target.value })
                            }
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Image URL</Label>
                          <Input
                            value={editCategory.image}
                            onChange={(e) =>
                              setEditCategory({ ...editCategory, image: e.target.value })
                            }
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditCategory(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={deleteId === category.id}
                  onOpenChange={(open) => !open && setDeleteId(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(category.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Category</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete &quot;{category.name}&quot;?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteId(null)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(category.id)}>
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {categoryList.length === 0 && (
        <div className="text-center py-12 text-muted-foreground rounded-2xl border bg-card">
          <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No categories yet</p>
        </div>
      )}
    </div>
  );
}
