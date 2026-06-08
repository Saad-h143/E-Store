"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, FolderTree, Loader2, Upload, X } from "lucide-react";
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
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  uploadImage,
} from "@/lib/supabase/queries";
import { toast } from "sonner";
import type { Category, Subcategory } from "@/types";

export default function AdminCategoriesPage() {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "", image: "" });
  // Optional subcategories entered while creating a new category
  const [newCatSubs, setNewCatSubs] = useState<string[]>([]);
  const [subDraft, setSubDraft] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Subcategory state
  const [subcategoriesMap, setSubcategoriesMap] = useState<Record<string, Subcategory[]>>({});
  const [addSubOpen, setAddSubOpen] = useState<string | null>(null);
  const [editSub, setEditSub] = useState<Subcategory | null>(null);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  const [newSub, setNewSub] = useState({ name: "", description: "", image: "" });

  const loadSubcategoriesForAll = useCallback(async (cats: Category[]) => {
    const map: Record<string, Subcategory[]> = {};
    await Promise.all(
      cats.map(async (cat) => {
        const subs = await getSubcategories(cat.id);
        map[cat.id] = subs;
      })
    );
    setSubcategoriesMap(map);
  }, []);

  const loadCategories = useCallback(async () => {
    const data = await getCategories();
    setCategoryList(data);
    await loadSubcategoriesForAll(data);
    setLoading(false);
  }, [loadSubcategoriesForAll]);

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

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const addSubDraft = () => {
    const name = subDraft.trim();
    if (!name) return;
    if (newCatSubs.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setSubDraft("");
      return;
    }
    setNewCatSubs((prev) => [...prev, name]);
    setSubDraft("");
  };

  const handleAdd = async () => {
    if (!newCategory.name) {
      toast.error("Please enter a category name");
      return;
    }
    setSaving(true);
    try {
      const cat = await createCategory({
        name: newCategory.name,
        slug: slugify(newCategory.name),
        description: newCategory.description,
        image: newCategory.image || "",
      });

      // Optionally create the subcategories entered in the same modal.
      const createdSubs: Subcategory[] = [];
      for (const subName of newCatSubs) {
        try {
          const sub = await createSubcategory({
            categoryId: cat.id,
            name: subName,
            slug: slugify(subName),
            description: "",
            image: "",
          });
          createdSubs.push(sub);
        } catch {
          // Skip a failed subcategory but keep the category.
        }
      }

      setCategoryList((prev) => [...prev, cat]);
      if (createdSubs.length) {
        setSubcategoriesMap((prev) => ({ ...prev, [cat.id]: createdSubs }));
      }
      setNewCategory({ name: "", description: "", image: "" });
      setNewCatSubs([]);
      setSubDraft("");
      setAddOpen(false);
      toast.success(
        createdSubs.length
          ? `Category added with ${createdSubs.length} subcategor${createdSubs.length === 1 ? "y" : "ies"}`
          : "Category added"
      );
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

  const handleAddSub = async (categoryId: string) => {
    if (!newSub.name) {
      toast.error("Please enter a subcategory name");
      return;
    }
    setSaving(true);
    try {
      const slug = newSub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const sub = await createSubcategory({
        categoryId,
        name: newSub.name,
        slug,
        description: newSub.description,
        image: newSub.image,
      });
      setSubcategoriesMap((prev) => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), sub],
      }));
      setNewSub({ name: "", description: "", image: "" });
      setAddSubOpen(null);
      toast.success("Subcategory added");
    } catch {
      toast.error("Failed to create subcategory");
    }
    setSaving(false);
  };

  const handleUpdateSub = async () => {
    if (!editSub) return;
    setSaving(true);
    try {
      const slug = editSub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await updateSubcategory(editSub.id, {
        name: editSub.name,
        slug,
        description: editSub.description,
        image: editSub.image,
      });
      setSubcategoriesMap((prev) => ({
        ...prev,
        [editSub.categoryId]: (prev[editSub.categoryId] || []).map((s) =>
          s.id === editSub.id ? { ...editSub, slug } : s
        ),
      }));
      setEditSub(null);
      toast.success("Subcategory updated");
    } catch {
      toast.error("Failed to update subcategory");
    }
    setSaving(false);
  };

  const handleDeleteSub = async (sub: Subcategory) => {
    try {
      await deleteSubcategory(sub.id);
      setSubcategoriesMap((prev) => ({
        ...prev,
        [sub.categoryId]: (prev[sub.categoryId] || []).filter((s) => s.id !== sub.id),
      }));
      setDeleteSubId(null);
      toast.success("Subcategory deleted");
    } catch {
      toast.error("Failed to delete subcategory");
    }
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
        <Dialog
          open={addOpen}
          onOpenChange={(o) => {
            setAddOpen(o);
            if (!o) {
              setNewCatSubs([]);
              setSubDraft("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white">
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

              {/* Optional subcategories */}
              <div className="space-y-2">
                <Label>
                  Subcategories{" "}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={subDraft}
                    onChange={(e) => setSubDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubDraft();
                      }
                    }}
                    placeholder="e.g., LCD, Battery — press Enter to add"
                    className="rounded-xl flex-1"
                  />
                  <Button type="button" variant="outline" className="rounded-xl" onClick={addSubDraft}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newCatSubs.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {newCatSubs.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-medium"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => setNewCatSubs((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
                          aria-label={`Remove ${s}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  setNewCatSubs([]);
                  setSubDraft("");
                }}
              >
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
            className="rounded-2xl border bg-card/80 backdrop-blur-xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            <div className="relative h-32 bg-gradient-to-br from-muted/40 to-muted group/image overflow-hidden">
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-contain p-4 group-hover/image:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FolderTree className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300" />
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
                      className="flex-1 rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-colors"
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
                      className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30 transition-colors"
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

              {/* Subcategories Section */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subcategories</span>
                  <Dialog open={addSubOpen === category.id} onOpenChange={(open) => { if (!open) { setAddSubOpen(null); setNewSub({ name: "", description: "", image: "" }); } }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setAddSubOpen(category.id)}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Subcategory to {category.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={newSub.name} onChange={(e) => setNewSub({ ...newSub, name: e.target.value })} placeholder="e.g., Budget Phones" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input value={newSub.description} onChange={(e) => setNewSub({ ...newSub, description: e.target.value })} placeholder="Short description" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Image URL</Label>
                          <Input value={newSub.image} onChange={(e) => setNewSub({ ...newSub, image: e.target.value })} placeholder="Image URL (optional)" className="rounded-xl" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => { setAddSubOpen(null); setNewSub({ name: "", description: "", image: "" }); }}>Cancel</Button>
                        <Button onClick={() => handleAddSub(category.id)} disabled={saving}>
                          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Add Subcategory
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {(subcategoriesMap[category.id] || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No subcategories</p>
                ) : (
                  <div className="space-y-1.5">
                    {(subcategoriesMap[category.id] || []).map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-2.5 py-1.5">
                        <span className="truncate">{sub.name}</span>
                        <div className="flex gap-1 shrink-0">
                          <Dialog open={editSub?.id === sub.id} onOpenChange={(open) => !open && setEditSub(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditSub({ ...sub })}>
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Subcategory</DialogTitle>
                              </DialogHeader>
                              {editSub && (
                                <div className="space-y-4 mt-2">
                                  <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={editSub.name} onChange={(e) => setEditSub({ ...editSub, name: e.target.value })} className="rounded-xl" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input value={editSub.description} onChange={(e) => setEditSub({ ...editSub, description: e.target.value })} className="rounded-xl" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Image URL</Label>
                                    <Input value={editSub.image} onChange={(e) => setEditSub({ ...editSub, image: e.target.value })} className="rounded-xl" />
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditSub(null)}>Cancel</Button>
                                <Button onClick={handleUpdateSub} disabled={saving}>
                                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  Save
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={deleteSubId === sub.id} onOpenChange={(open) => !open && setDeleteSubId(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteSubId(sub.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Subcategory</DialogTitle>
                                <DialogDescription>Are you sure you want to delete &quot;{sub.name}&quot;?</DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteSubId(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => handleDeleteSub(sub)}>Delete</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
