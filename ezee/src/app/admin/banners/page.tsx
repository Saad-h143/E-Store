"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, ImageIcon, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadImage,
} from "@/lib/supabase/queries";
import { toast } from "sonner";
import type { BannerSlide } from "@/types";

type BannerWithMeta = BannerSlide & { active: boolean; sortOrder: number };

export default function AdminBannersPage() {
  const [bannerList, setBannerList] = useState<BannerWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editBanner, setEditBanner] = useState<BannerWithMeta | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [newBanner, setNewBanner] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    ctaText: "Shop Now",
    ctaLink: "/shop",
  });

  const loadBanners = useCallback(async () => {
    const data = await getAllBanners();
    setBannerList(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "new" | "edit"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file, "banners");
      if (target === "new") {
        setNewBanner((prev) => ({ ...prev, image: url }));
      } else if (editBanner) {
        setEditBanner({ ...editBanner, image: url });
      }
      toast.success("Image uploaded!");
    } catch (err) {
      console.error("[Banner image upload]", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleAdd = async () => {
    if (!newBanner.title) {
      toast.error("Please enter a banner title");
      return;
    }
    setSaving(true);
    try {
      const created = await createBanner({
        title: newBanner.title,
        subtitle: newBanner.subtitle,
        description: newBanner.description,
        image: newBanner.image,
        ctaText: newBanner.ctaText,
        ctaLink: newBanner.ctaLink,
      });
      setBannerList((prev) => [...prev, { ...created, active: true, sortOrder: prev.length }]);
      setNewBanner({ title: "", subtitle: "", description: "", image: "", ctaText: "Shop Now", ctaLink: "/shop" });
      setAddOpen(false);
      toast.success("Banner added");
    } catch {
      toast.error("Failed to create banner");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBanner(id);
      setBannerList((prev) => prev.filter((b) => b.id !== id));
      setDeleteId(null);
      toast.success("Banner deleted");
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  const handleUpdate = async () => {
    if (!editBanner) return;
    setSaving(true);
    try {
      await updateBanner(editBanner.id, {
        title: editBanner.title,
        subtitle: editBanner.subtitle,
        description: editBanner.description,
        image: editBanner.image,
        ctaText: editBanner.ctaText,
        ctaLink: editBanner.ctaLink,
        active: editBanner.active,
      });
      setBannerList((prev) => prev.map((b) => (b.id === editBanner.id ? editBanner : b)));
      setEditBanner(null);
      toast.success("Banner updated");
    } catch {
      toast.error("Failed to update banner");
    }
    setSaving(false);
  };

  const toggleBannerActive = async (banner: BannerWithMeta) => {
    try {
      await updateBanner(banner.id, { active: !banner.active });
      setBannerList((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b))
      );
      toast.success(banner.active ? "Banner deactivated" : "Banner activated");
    } catch {
      toast.error("Failed to toggle banner");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage hero carousel banners</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage hero carousel banners
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  placeholder="Banner title"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={newBanner.subtitle}
                  onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                  placeholder="Banner subtitle"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newBanner.description}
                  onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })}
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
                    value={newBanner.image}
                    onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CTA Text</Label>
                  <Input
                    value={newBanner.ctaText}
                    onChange={(e) => setNewBanner({ ...newBanner, ctaText: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Link</Label>
                  <Input
                    value={newBanner.ctaLink}
                    onChange={(e) => setNewBanner({ ...newBanner, ctaLink: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Banner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bannerList.map((banner, index) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border bg-card/80 backdrop-blur-xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            <div className={`relative h-48 bg-gradient-to-br ${banner.gradient}`}>
              {banner.image ? (
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover opacity-40 mix-blend-luminosity"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : null}
              <div className="absolute inset-0 flex items-center p-6">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider font-medium">
                    {banner.subtitle}
                  </p>
                  <h3 className="text-xl font-bold text-white mt-1">{banner.title}</h3>
                  <p className="text-sm text-white/70 mt-1 line-clamp-2">
                    {banner.description}
                  </p>
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className={`text-xs ${banner.active ? "bg-emerald-500/80 text-white" : "bg-black/50 text-white"}`}>
                  {banner.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={banner.active}
                  onCheckedChange={() => toggleBannerActive(banner)}
                />
                <div className="text-sm">
                  <Badge variant="secondary" className="text-xs mr-2">
                    {banner.ctaText}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{banner.ctaLink}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog
                  open={editBanner?.id === banner.id}
                  onOpenChange={(open) => !open && setEditBanner(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setEditBanner({ ...banner })}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Banner</DialogTitle>
                    </DialogHeader>
                    {editBanner && (
                      <div className="space-y-3 mt-2">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={editBanner.title}
                            onChange={(e) =>
                              setEditBanner({ ...editBanner, title: e.target.value })
                            }
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subtitle</Label>
                          <Input
                            value={editBanner.subtitle}
                            onChange={(e) =>
                              setEditBanner({ ...editBanner, subtitle: e.target.value })
                            }
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={editBanner.description}
                            onChange={(e) =>
                              setEditBanner({ ...editBanner, description: e.target.value })
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
                              value={editBanner.image}
                              onChange={(e) =>
                                setEditBanner({ ...editBanner, image: e.target.value })
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
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>CTA Text</Label>
                            <Input
                              value={editBanner.ctaText}
                              onChange={(e) =>
                                setEditBanner({ ...editBanner, ctaText: e.target.value })
                              }
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>CTA Link</Label>
                            <Input
                              value={editBanner.ctaLink}
                              onChange={(e) =>
                                setEditBanner({ ...editBanner, ctaLink: e.target.value })
                              }
                              className="rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditBanner(null)}>
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
                  open={deleteId === banner.id}
                  onOpenChange={(open) => !open && setDeleteId(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(banner.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Banner</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this banner?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteId(null)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(banner.id)}>
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

      {bannerList.length === 0 && (
        <div className="text-center py-12 text-muted-foreground rounded-2xl border bg-card">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No banners yet</p>
        </div>
      )}
    </div>
  );
}
