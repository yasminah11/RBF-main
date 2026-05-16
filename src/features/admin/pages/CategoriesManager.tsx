import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  order: number;
  name_en: string;
  name_ar: string;
  name_tr: string;
  slug: string;
  description_en?: string;
  description_ar?: string;
  description_tr?: string;
  status: "active" | "inactive";
  productCount: number;
  image?: string;
  parentId?: string;
}

export function CategoriesManager() {
  const { t, locale, dir } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (data)
      setCategories(
        data.map((c: any) => ({
          ...c,
          order: c.display_order,
          status: c.status === "active" ? "active" : "inactive",
          image: c.image_url,
          productCount: 0,
        })),
      );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openModal = (category: Category | null = null) => {
    setCurrentCategory(category);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const filteredCategories = categories
    .filter(
      (c) =>
        c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name_tr.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => a.order - b.order);

  const handleMove = (id: string, direction: "up" | "down") => {
    const idx = categories.findIndex((c) => c.id === id);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === categories.length - 1)
    )
      return;

    const newCategories = [...categories];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;

    const tempOrder = newCategories[idx].order;
    newCategories[idx].order = newCategories[targetIdx].order;
    newCategories[targetIdx].order = tempOrder;

    setCategories(newCategories.sort((a, b) => a.order - b.order));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let imageUrl = currentCategory?.image || null;

    if (imagePreview && imagePreview.startsWith("blob:")) {
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("category-images")
          .upload(fileName, file, { upsert: true });
        if (uploadError) {
          toast.error("Image upload failed: " + uploadError.message);
          return;
        }
        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from("category-images")
            .getPublicUrl(uploadData.path);
          imageUrl = urlData.publicUrl;
        }
      }
    }

    const categoryData = {
      name_en: formData.get("name_en") as string,
      name_ar: formData.get("name_ar") as string,
      name_tr: formData.get("name_tr") as string,
      slug: formData.get("slug") as string,
      status: formData.get("status") as string,
      image_url: imageUrl,
    };

    let saveError = null;
    if (currentCategory?.id) {
      const { error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", currentCategory.id);
      saveError = error;
    } else {
      const { error } = await supabase.from("categories").insert({
        ...categoryData,
        display_order: categories.length + 1,
      });
      saveError = error;
    }

    if (saveError) {
      toast.error("Save failed: " + saveError.message);
      return;
    }

    toast.success(t.admin.common.success);
    setIsModalOpen(false);
    fetchCategories();
  };

  const toggleStatus = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const newStatus = cat.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("categories")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      toast.error("Status update failed: " + error.message);
      return;
    }
    toast.success(t.admin.common.success);
    fetchCategories();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary">
            {t.admin.categories.title}
          </h1>
          <p className="text-muted-foreground">
            Manage your store dress collections
          </p>
        </div>
        <Button
          onClick={() => openModal(null)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
        >
          <Plus className="h-4 w-4 mr-2 rtl:ml-2" />
          {t.admin.categories.addCategory}
        </Button>
      </div>

      <Card className="bg-card border-border p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
          <Input
            placeholder="Search categories..."
            className="pl-10 rtl:pr-10 bg-background border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      <Card className="bg-card border-border overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-4 font-medium w-16">#</th>
                <th className="px-6 py-4 font-medium">Name (EN/AR/TR)</th>
                <th className="px-6 py-4 font-medium">
                  {t.admin.categories.slug}
                </th>
                <th className="px-6 py-4 font-medium">
                  {t.admin.categories.productCount}
                </th>
                <th className="px-6 py-4 font-medium">
                  {t.admin.products.status}
                </th>
                <th className="px-6 py-4 font-medium text-right rtl:text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCategories.map((cat, i) => (
                <tr
                  key={cat.id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleMove(cat.id, "up")}
                        disabled={i === 0}
                        className="text-muted-foreground hover:text-primary disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <span className="font-bold text-foreground text-xs">
                        {cat.order}
                      </span>
                      <button
                        onClick={() => handleMove(cat.id, "down")}
                        disabled={i === filteredCategories.length - 1}
                        className="text-muted-foreground hover:text-primary disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-foreground flex items-center gap-2">
                        {cat.parentId && (
                          <LinkIcon className="h-3 w-3 text-primary/50" />
                        )}
                        {cat.name_en}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {cat.name_ar} • {cat.name_tr}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-primary border border-primary/20">
                      {cat.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    {cat.productCount}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      onClick={() => toggleStatus(cat.id)}
                      className={cn(
                        "text-[10px] uppercase tracking-widest cursor-pointer transition-all",
                        cat.status === "active"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {cat.status === "active"
                        ? t.admin.products.active
                        : t.admin.products.inactive}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right rtl:text-left">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(cat)}
                        className="h-8 w-8 text-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus(cat.id)}
                        className="h-8 w-8 text-destructive"
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

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border">
          {filteredCategories.map((cat, i) => (
            <div key={cat.id} className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2 mr-2">
                  <button
                    onClick={() => handleMove(cat.id, "up")}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-primary disabled:opacity-30"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                  <span className="font-bold text-foreground text-sm">
                    {cat.order}
                  </span>
                  <button
                    onClick={() => handleMove(cat.id, "down")}
                    disabled={i === filteredCategories.length - 1}
                    className="text-muted-foreground hover:text-primary disabled:opacity-30"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {cat.parentId && (
                      <LinkIcon className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                    )}
                    <h3 className="font-bold text-foreground truncate">
                      {cat.name_en}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {cat.name_ar} • {cat.name_tr}
                  </p>
                  <div className="mt-2">
                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-primary border border-primary/20">
                      /{cat.slug}
                    </code>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Products</p>
                    <p className="text-sm font-bold text-foreground">{cat.productCount}</p>
                  </div>
                  <Badge
                    onClick={() => toggleStatus(cat.id)}
                    className={cn(
                      "text-[10px] uppercase tracking-widest cursor-pointer",
                      cat.status === "active"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {cat.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal(cat)}
                    className="h-8 px-3 text-[10px] uppercase tracking-widest font-bold border-primary/20 text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(cat.id)}
                    className="h-8 px-3 text-[10px] uppercase tracking-widest font-bold border-destructive/20 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Status
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto bg-card border-border p-0 sm:p-6 rounded-none sm:rounded-lg">
          <DialogHeader className="p-4 sm:p-0 border-b sm:border-0 border-border bg-background sm:bg-transparent">
            <DialogTitle className="font-display text-xl sm:text-2xl text-primary">
              {currentCategory
                ? t.admin.categories.modal.editTitle
                : t.admin.categories.modal.addTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6 p-4 sm:p-0 pt-4 sm:pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name_en"
                    className="text-xs uppercase tracking-widest text-muted-foreground"
                  >
                    {t.admin.categories.nameEn}
                  </Label>
                  <Input
                    id="name_en"
                    name="name_en"
                    defaultValue={currentCategory?.name_en}
                    required
                    className="bg-background border-border h-11 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="name_ar"
                    className="text-xs uppercase tracking-widest text-muted-foreground"
                  >
                    {t.admin.categories.nameAr}
                  </Label>
                  <Input
                    id="name_ar"
                    name="name_ar"
                    dir="rtl"
                    defaultValue={currentCategory?.name_ar}
                    required
                    className="bg-background border-border text-right h-11 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="name_tr"
                    className="text-xs uppercase tracking-widest text-muted-foreground"
                  >
                    {t.admin.categories.nameTr}
                  </Label>
                  <Input
                    id="name_tr"
                    name="name_tr"
                    defaultValue={currentCategory?.name_tr}
                    required
                    className="bg-background border-border h-11 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="slug"
                    className="text-xs uppercase tracking-widest text-muted-foreground"
                  >
                    {t.admin.categories.slug}
                  </Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={currentCategory?.slug}
                    required
                    className="bg-background border-border h-11 sm:h-10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="parentId"
                    className="text-xs uppercase tracking-widest text-muted-foreground"
                  >
                    {t.admin.categories.parent}
                  </Label>
                  <Select
                    name="parentId"
                    defaultValue={currentCategory?.parentId || "none"}
                  >
                    <SelectTrigger className="bg-background border-border h-11 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">
                        {t.admin.categories.none}
                      </SelectItem>
                      {categories
                        .filter(
                          (c) => !c.parentId && c.id !== currentCategory?.id,
                        )
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name_en}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t.admin.categories.modal.image}
                  </Label>
                  <div
                    className="h-32 sm:h-40 rounded border border-dashed border-border flex flex-col items-center justify-center gap-2 bg-background group cursor-pointer hover:bg-muted/30 transition-colors relative overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview || currentCategory?.image ? (
                      <>
                        <img
                          src={imagePreview || currentCategory?.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Upload Image
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Label
                    htmlFor="status"
                    className="text-xs uppercase tracking-widest text-muted-foreground"
                  >
                    {t.admin.products.status}
                  </Label>
                  <Select
                    name="status"
                    defaultValue={currentCategory?.status || "active"}
                  >
                    <SelectTrigger className="w-[120px] bg-background border-border h-11 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-6 border-t border-border flex flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="bg-background border-border w-full sm:w-auto h-11 sm:h-10 order-2 sm:order-1"
              >
                {t.admin.common.cancel}
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold font-bold uppercase tracking-widest text-xs w-full sm:w-auto h-11 sm:h-10 order-1 sm:order-2"
              >
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
