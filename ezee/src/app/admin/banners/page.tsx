"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, ImageIcon } from "lucide-react";
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
import { banners as initialBanners } from "@/data/banners";
import { toast } from "sonner";
import { BannerSlide } from "@/types";

export default function AdminBannersPage() {
  const [bannerList, setBannerList] = useState(initialBanners);
  const [editBanner, setEditBanner] = useState<BannerSlide | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    ctaText: "Shop Now",
    ctaLink: "/shop",
  });

  const handleAdd = () => {
    if (!newBanner.title) {
      toast.error("Please enter a banner title");
      return;
    }
    const banner: BannerSlide = {
      id: `ban-${Date.now()}`,
      ...newBanner,
      gradient: "from-slate-950 via-zinc-900 to-neutral-950",
    };
    setBannerList((prev) => [...prev, banner]);
    setNewBanner({ title: "", subtitle: "", description: "", image: "", ctaText: "Shop Now", ctaLink: "/shop" });
    setAddOpen(false);
    toast.success("Banner added");
  };

  const handleDelete = (id: string) => {
    setBannerList((prev) => prev.filter((b) => b.id !== id));
    setDeleteId(null);
    toast.success("Banner deleted");
  };

  const handleUpdate = () => {
    if (!editBanner) return;
    setBannerList((prev) => prev.map((b) => (b.id === editBanner.id ? editBanner : b)));
    setEditBanner(null);
    toast.success("Banner updated");
  };

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
            <Button className="rounded-xl">
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
                <Label>Image URL</Label>
                <Input
                  value={newBanner.image}
                  onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })}
                  placeholder="https://..."
                  className="rounded-xl"
                />
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
              <Button onClick={handleAdd}>Add Banner</Button>
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
            className="rounded-2xl border bg-card overflow-hidden"
          >
            <div className={`relative h-48 bg-gradient-to-br ${banner.gradient}`}>
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover opacity-40 mix-blend-luminosity"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
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
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="text-sm">
                <Badge variant="secondary" className="text-xs mr-2">
                  {banner.ctaText}
                </Badge>
                <span className="text-muted-foreground text-xs">{banner.ctaLink}</span>
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
                          <Label>Image URL</Label>
                          <Input
                            value={editBanner.image}
                            onChange={(e) =>
                              setEditBanner({ ...editBanner, image: e.target.value })
                            }
                            className="rounded-xl"
                          />
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
                      <Button onClick={handleUpdate}>Save Changes</Button>
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
