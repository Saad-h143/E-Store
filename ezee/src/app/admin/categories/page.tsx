"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, FolderTree, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadImage,
} from "@/lib/supabase/queries";
import { toast } from "sonner";
import type { Category } from "@/types";

export default function AdminCategoriesPage() {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "", image: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = useCallback(async () => {
    const data = await getCategories();
    setCategoryList(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "new" | "edit"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file, "categories");
      if (target === "new") {
        setNewCategory((prev) => ({ ...prev, image: url }));
      } else if (editCategory) {
        setEditCategory({ ...editCategory, image: url });
      }
      toast.success("Image uploaded!");
    } catch {
      toast.error("Failed to upload image");
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleAdd = async () => {
    if (!newCategory.name) {
      toast.error("Please enter a category name");
      return;
    }
    setSaving(true);
    try {
      const slug = newCategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const cat = await createCategory({
        name: newCategory.name,
        slug,
        description: newCategory.description,
        image: newCategory.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
      });
      setCategoryList((prev) => [...prev, cat]);
      setNewCategory({ name: "", description: "", image: "" });
      setAddOpen(false);
      toast.success("Category added");
    } catch {
      toast.error("Failed to create category");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategoryList((prev) => prev.filter((c) => c.id !== id));
      setDeleteId(null);
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category. It may have products assigned.");
    }
  };

  const handleUpdate = async () => {
    if (!editCategory) return;
    setSaving(true);
    try {
      const slug = editCategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      await updateCategory(editCategory.id, {
        name: editCategory.name,
        slug,
        description: editCategory.description,
        image: editCategory.image,
      });
      setCategoryList((prev) =>
        prev.map((c) => (c.id === editCategory.id ? { ...editCategory, slug } : c))
      );
      setEditCategory(null);
      toast.success("Category updated");
    } catch {
      toast.error("Failed to update category");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage product categories and brands</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

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
                <Label>Image</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "new")}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Input
                    value={newCategory.image}
                    onChange={(e) => setNewCategory({ ...newCategory, image: e.target.value })}
                    placeholder="Image URL or upload"
                    className="rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Category
              </Button>
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
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FolderTree className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
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
                          <Label>Image</Label>
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, "edit")}
                            className="hidden"
                          />
                          <div className="flex gap-2">
                            <Input
                              value={editCategory.image}
                              onChange={(e) =>
                                setEditCategory({ ...editCategory, image: e.target.value })
                              }
                              className="rounded-xl flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => editFileInputRef.current?.click()}
                              disabled={uploadingImage}
                            >
                              {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditCategory(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdate} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
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
