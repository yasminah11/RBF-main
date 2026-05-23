import { useState, useEffect, useRef } from "react";
import {
  Globe,
  CreditCard,
  Mail,
  FileText,
  HelpCircle,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Loader2,
  Image,
  Video,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Tab = "general" | "contact" | "about" | "faq" | "returns" | "header";

async function loadSetting(id: string) {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("id", id)
    .single();
  return data?.value || null;
}

async function saveSetting(id: string, value: any) {
  const { error } = await supabase
    .from("site_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [saving, setSaving] = useState(false);

  // General
  const [general, setGeneral] = useState({
    brand_name_en: "",
    brand_name_ar: "",
    brand_name_tr: "",
    logo_url: "",
    footer_logo_url: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [footerLogoFile, setFooterLogoFile] = useState<File | null>(null);
  const [footerLogoPreview, setFooterLogoPreview] = useState<string>("");

  // Contact
  const [contact, setContact] = useState({
    email: "",
    phone: "",
    address: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
  });

  // About
  const [about, setAbout] = useState({ en: "", ar: "", tr: "" });

  // FAQ
  const [faqItems, setFaqItems] = useState<
    {
      q_en: string;
      a_en: string;
      q_ar: string;
      a_ar: string;
      q_tr: string;
      a_tr: string;
    }[]
  >([]);

  // Returns
  const [returns, setReturns] = useState({
    en: {
      policy: "",
      conditions: "",
      exchanges: "",
      timeframe: "",
      refund: "",
    },
    ar: {
      policy: "",
      conditions: "",
      exchanges: "",
      timeframe: "",
      refund: "",
    },
    tr: {
      policy: "",
      conditions: "",
      exchanges: "",
      timeframe: "",
      refund: "",
    },
  });
  const [returnsLang, setReturnsLang] = useState<"en" | "ar" | "tr">("en");

  // Header Media
  const [headerMedia, setHeaderMedia] = useState<{
    type: "image" | "slideshow" | "video";
    images: string[];
    video_url: string;
    interval: number;
  }>({ type: "image", images: [""], video_url: "", interval: 3 });
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (activeTab === "general")
      loadSetting("general").then((d) => {
        if (d) {
          setGeneral(d);
          setLogoPreview(d.logo_url || "");
          setFooterLogoPreview(d.footer_logo_url || "");
        }
      });
    if (activeTab === "contact")
      loadSetting("contact").then((d) => d && setContact(d));
    if (activeTab === "about")
      loadSetting("about").then((d) => d && setAbout(d));
    if (activeTab === "faq")
      loadSetting("faq").then((d) => d?.items && setFaqItems(d.items));
    if (activeTab === "returns")
      loadSetting("returns").then((d) => d && setReturns(d));
    if (activeTab === "header")
      loadSetting("header_media").then((d) => {
        if (d) setHeaderMedia(d);
      });
  }, [activeTab]);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage
      .from("site-assets")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "general") {
        let logo_url = general.logo_url;
        let footer_logo_url = general.footer_logo_url;

        if (logoFile) {
          const ext = logoFile.name.split(".").pop();
          logo_url = await uploadFile(logoFile, `logos/brand-logo.${ext}`);
          setLogoFile(null);
        }
        if (footerLogoFile) {
          const ext = footerLogoFile.name.split(".").pop();
          footer_logo_url = await uploadFile(
            footerLogoFile,
            `logos/footer-logo.${ext}`,
          );
          setFooterLogoFile(null);
        }
        await saveSetting("general", { ...general, logo_url, footer_logo_url });
        setGeneral((prev) => ({ ...prev, logo_url, footer_logo_url }));
        setLogoPreview(logo_url);
        setFooterLogoPreview(footer_logo_url);
      }
      if (activeTab === "contact") await saveSetting("contact", contact);
      if (activeTab === "about") await saveSetting("about", about);
      if (activeTab === "faq") await saveSetting("faq", { items: faqItems });
      if (activeTab === "returns") await saveSetting("returns", returns);
      if (activeTab === "header")
        await saveSetting("header_media", headerMedia);

      toast.success("Saved successfully!");
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMediaImageUpload = async (file: File, index: number) => {
    setUploadingMedia(true);
    try {
      const ext = file.name.split(".").pop();
      const url = await uploadFile(file, `header/image-${Date.now()}.${ext}`);
      const newImages = [...headerMedia.images];
      newImages[index] = url;
      setHeaderMedia({ ...headerMedia, images: newImages });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingMedia(true);
    try {
      const ext = file.name.split(".").pop();
      const url = await uploadFile(file, `header/video-${Date.now()}.${ext}`);
      setHeaderMedia({ ...headerMedia, video_url: url });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "header", label: "Header Media", icon: Monitor },
    { id: "contact", label: "Contact", icon: Mail },
    { id: "about", label: "About", icon: FileText },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "returns", label: "Returns", icon: RotateCcw },
  ] as const;

  const LogoSection = ({
    title,
    preview,
    onFile,
    onUrl,
    urlValue,
    onRemove,
    previewAlt,
  }: {
    title: string;
    preview: string;
    onFile: (f: File) => void;
    onUrl: (url: string) => void;
    urlValue: string;
    onRemove: () => void;
    previewAlt: string;
  }) => (
    <Card className="bg-card border-border p-6 space-y-4">
      <h2 className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-2">
        <CreditCard className="h-4 w-4" /> {title}
      </h2>
      {preview && (
        <div className="flex items-center gap-4">
          <img
            src={preview}
            alt={previewAlt}
            className="h-16 w-auto object-contain border border-border rounded p-2 bg-background"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
          </Button>
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Upload Logo
        </Label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:border file:border-border file:text-xs file:uppercase file:tracking-widest file:font-bold file:bg-card file:text-primary hover:file:bg-primary hover:file:text-primary-foreground file:cursor-pointer file:transition-all"
        />
        <p className="text-[10px] text-muted-foreground">
          PNG, JPG, SVG — recommended 200×60px
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Or Paste URL
        </Label>
        <Input
          value={urlValue}
          onChange={(e) => onUrl(e.target.value)}
          placeholder="https://..."
          className="bg-background border-border"
        />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-primary">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store configuration and content
        </p>
      </div>

      <div className="flex gap-2 flex-wrap border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <Card className="bg-card border-border p-6 space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-2">
              <Globe className="h-4 w-4" /> Brand Name
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["en", "ar", "tr"] as const).map((lang) => (
                <div key={lang} className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {lang === "en"
                      ? "English"
                      : lang === "ar"
                        ? "Arabic"
                        : "Turkish"}
                  </Label>
                  <Input
                    value={
                      general[`brand_name_${lang}` as keyof typeof general]
                    }
                    onChange={(e) =>
                      setGeneral({
                        ...general,
                        [`brand_name_${lang}`]: e.target.value,
                      })
                    }
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    className="bg-background border-border"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Navbar Logo */}
          <LogoSection
            title="Navbar Logo"
            preview={logoPreview}
            previewAlt="Navbar Logo"
            urlValue={general.logo_url}
            onFile={(f) => {
              setLogoFile(f);
              setLogoPreview(URL.createObjectURL(f));
            }}
            onUrl={(url) => {
              setGeneral({ ...general, logo_url: url });
              setLogoPreview(url);
              setLogoFile(null);
            }}
            onRemove={() => {
              setLogoPreview("");
              setLogoFile(null);
              setGeneral({ ...general, logo_url: "" });
            }}
          />

          {/* Footer Logo */}
          <LogoSection
            title="Footer Logo"
            preview={footerLogoPreview}
            previewAlt="Footer Logo"
            urlValue={general.footer_logo_url}
            onFile={(f) => {
              setFooterLogoFile(f);
              setFooterLogoPreview(URL.createObjectURL(f));
            }}
            onUrl={(url) => {
              setGeneral({ ...general, footer_logo_url: url });
              setFooterLogoPreview(url);
              setFooterLogoFile(null);
            }}
            onRemove={() => {
              setFooterLogoPreview("");
              setFooterLogoFile(null);
              setGeneral({ ...general, footer_logo_url: "" });
            }}
          />
        </div>
      )}

      {/* Header Media Tab */}
      {activeTab === "header" && (
        <div className="space-y-6">
          {/* Type Selector */}
          <Card className="bg-card border-border p-6 space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-2">
              <Monitor className="h-4 w-4" /> Header Display Type
            </h2>
            <div className="flex gap-3">
              {(
                [
                  { id: "image", label: "Single Image", icon: Image },
                  { id: "slideshow", label: "Slideshow (3s)", icon: Image },
                  { id: "video", label: "Video", icon: Video },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() =>
                    setHeaderMedia({ ...headerMedia, type: opt.id })
                  }
                  className={cn(
                    "flex-1 py-3 px-4 text-[10px] uppercase tracking-widest font-bold rounded border transition-all flex flex-col items-center gap-2",
                    headerMedia.type === opt.id
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "border-border text-muted-foreground hover:border-primary/30",
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Single Image or Slideshow */}
          {(headerMedia.type === "image" ||
            headerMedia.type === "slideshow") && (
            <Card className="bg-card border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-widest font-bold text-primary">
                  {headerMedia.type === "slideshow"
                    ? "Slideshow Images"
                    : "Header Image"}
                </h2>
                {headerMedia.type === "slideshow" && (
                  <Button
                    onClick={() =>
                      setHeaderMedia({
                        ...headerMedia,
                        images: [...headerMedia.images, ""],
                      })
                    }
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1 border-border"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Image
                  </Button>
                )}
              </div>

              {headerMedia.type === "slideshow" && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Interval (seconds)
                  </Label>
                  <div className="flex items-center gap-3">
                    {[2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          setHeaderMedia({ ...headerMedia, interval: s })
                        }
                        className={cn(
                          "h-9 w-12 rounded border text-sm font-bold transition-all",
                          headerMedia.interval === s
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary",
                        )}
                      >
                        {s}s
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {(headerMedia.type === "image"
                  ? [headerMedia.images[0]]
                  : headerMedia.images
                ).map((img, i) => (
                  <div key={i} className="space-y-3">
                    {headerMedia.type === "slideshow" && (
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Image {i + 1}
                        </Label>
                        {headerMedia.images.length > 1 && (
                          <button
                            onClick={() => {
                              const imgs = headerMedia.images.filter(
                                (_, idx) => idx !== i,
                              );
                              setHeaderMedia({ ...headerMedia, images: imgs });
                            }}
                            className="text-destructive hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                    {img && (
                      <div className="relative rounded-lg overflow-hidden h-32 bg-muted/20 border border-border group/img">
                        <img
                          src={img}
                          alt={`Header ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            const imgs = [...headerMedia.images];
                            imgs[i] = "";
                            setHeaderMedia({ ...headerMedia, images: imgs });
                          }}
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm border border-border rounded p-1.5 text-destructive hover:bg-destructive hover:text-white transition-all opacity-0 group-hover/img:opacity-100"
                          title="Remove image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">
                          Upload File
                        </Label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleMediaImageUpload(f, i);
                          }}
                          className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:border file:border-border file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-card file:text-primary hover:file:bg-primary hover:file:text-primary-foreground file:cursor-pointer file:transition-all"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">
                          Or Paste URL
                        </Label>
                        <Input
                          value={img || ""}
                          onChange={(e) => {
                            const imgs = [...headerMedia.images];
                            imgs[i] = e.target.value;
                            setHeaderMedia({ ...headerMedia, images: imgs });
                          }}
                          placeholder="https://..."
                          className="bg-background border-border text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {uploadingMedia && (
                <p className="text-xs text-primary animate-pulse">
                  Uploading...
                </p>
              )}
            </Card>
          )}

          {/* Video */}
          {headerMedia.type === "video" && (
            <Card className="bg-card border-border p-6 space-y-4">
              <h2 className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-2">
                <Video className="h-4 w-4" /> Header Video
              </h2>
              {headerMedia.video_url && (
                <div className="relative rounded-lg overflow-hidden h-40 bg-muted/20 border border-border group/vid">
                  <video
                    src={headerMedia.video_url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    autoPlay
                  />
                  <button
                    onClick={() =>
                      setHeaderMedia({ ...headerMedia, video_url: "" })
                    }
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm border border-border rounded p-1.5 text-destructive hover:bg-destructive hover:text-white transition-all opacity-0 group-hover/vid:opacity-100"
                    title="Remove video"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                    Upload Video
                  </Label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleVideoUpload(f);
                    }}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:border file:border-border file:text-xs file:uppercase file:tracking-widest file:font-bold file:bg-card file:text-primary hover:file:bg-primary hover:file:text-primary-foreground file:cursor-pointer file:transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    MP4, WebM — max 50MB
                  </p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                    Or Paste Video URL
                  </Label>
                  <Input
                    value={headerMedia.video_url}
                    onChange={(e) =>
                      setHeaderMedia({
                        ...headerMedia,
                        video_url: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="bg-background border-border"
                  />
                </div>
              </div>
              {uploadingMedia && (
                <p className="text-xs text-primary animate-pulse">
                  Uploading...
                </p>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="space-y-6">
          <Card className="bg-card border-border p-6 space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-2">
              <Mail className="h-4 w-4" /> Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["email", "phone"] as const).map((f) => (
                <div key={f} className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {f}
                  </Label>
                  <Input
                    value={contact[f]}
                    onChange={(e) =>
                      setContact({ ...contact, [f]: e.target.value })
                    }
                    className="bg-background border-border"
                  />
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Address
                </Label>
                <Textarea
                  value={contact.address}
                  onChange={(e) =>
                    setContact({ ...contact, address: e.target.value })
                  }
                  className="bg-background border-border resize-none"
                  rows={2}
                />
              </div>
            </div>
          </Card>
          <Card className="bg-card border-border p-6 space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-primary">
              Social Media
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["instagram", "facebook", "whatsapp"] as const).map((s) => (
                <div key={s} className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {s}
                  </Label>
                  <Input
                    value={contact[s]}
                    onChange={(e) =>
                      setContact({ ...contact, [s]: e.target.value })
                    }
                    placeholder={s === "whatsapp" ? "+90..." : "https://..."}
                    className="bg-background border-border"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* About Tab */}
      {activeTab === "about" && (
        <Card className="bg-card border-border p-6 space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-2">
            <FileText className="h-4 w-4" /> About Us Content
          </h2>
          {(["en", "ar", "tr"] as const).map((lang) => (
            <div key={lang} className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                {lang === "en"
                  ? "English"
                  : lang === "ar"
                    ? "Arabic"
                    : "Turkish"}
              </Label>
              <Textarea
                value={about[lang]}
                onChange={(e) => setAbout({ ...about, [lang]: e.target.value })}
                className={cn(
                  "bg-background border-border resize-none",
                  lang === "ar" && "text-right",
                )}
                dir={lang === "ar" ? "rtl" : "ltr"}
                rows={4}
              />
            </div>
          ))}
        </Card>
      )}

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() =>
                setFaqItems([
                  ...faqItems,
                  {
                    q_en: "",
                    a_en: "",
                    q_ar: "",
                    a_ar: "",
                    q_tr: "",
                    a_tr: "",
                  },
                ])
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-widest"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Question
            </Button>
          </div>
          {faqItems.map((item, i) => (
            <Card key={i} className="bg-card border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest font-bold text-primary">
                  Question {i + 1}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setFaqItems(faqItems.filter((_, idx) => idx !== i))
                  }
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {(["en", "ar", "tr"] as const).map((lang) => (
                <div
                  key={lang}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Q ({lang})
                    </Label>
                    <Input
                      value={item[`q_${lang}` as keyof typeof item]}
                      onChange={(e) => {
                        const u = [...faqItems];
                        u[i] = { ...u[i], [`q_${lang}`]: e.target.value };
                        setFaqItems(u);
                      }}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="bg-background border-border text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      A ({lang})
                    </Label>
                    <Textarea
                      value={item[`a_${lang}` as keyof typeof item]}
                      onChange={(e) => {
                        const u = [...faqItems];
                        u[i] = { ...u[i], [`a_${lang}`]: e.target.value };
                        setFaqItems(u);
                      }}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="bg-background border-border text-sm resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === "returns" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["en", "ar", "tr"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setReturnsLang(lang)}
                className={cn(
                  "px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border",
                  returnsLang === lang
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {lang === "en"
                  ? "English"
                  : lang === "ar"
                    ? "Arabic"
                    : "Turkish"}
              </button>
            ))}
          </div>
          <Card className="bg-card border-border p-6 space-y-4">
            {(
              [
                "policy",
                "conditions",
                "exchanges",
                "timeframe",
                "refund",
              ] as const
            ).map((field) => (
              <div key={field} className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  {field}
                </Label>
                <Textarea
                  value={returns[returnsLang][field]}
                  onChange={(e) =>
                    setReturns({
                      ...returns,
                      [returnsLang]: {
                        ...returns[returnsLang],
                        [field]: e.target.value,
                      },
                    })
                  }
                  dir={returnsLang === "ar" ? "rtl" : "ltr"}
                  className="bg-background border-border resize-none"
                  rows={3}
                />
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold font-bold uppercase tracking-widest text-xs"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
