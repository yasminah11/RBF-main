import { useState, useEffect } from "react";
import {
  Globe,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  FileText,
  HelpCircle,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Tab = "general" | "contact" | "about" | "faq" | "returns";

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

  // General state
  const [general, setGeneral] = useState({
    brand_name_en: "",
    brand_name_ar: "",
    brand_name_tr: "",
    logo_url: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Contact state
  const [contact, setContact] = useState({
    email: "",
    phone: "",
    address: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
  });

  // About state
  const [about, setAbout] = useState({ en: "", ar: "", tr: "" });

  // FAQ state
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

  // Returns state
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

  useEffect(() => {
    if (activeTab === "general")
      loadSetting("general").then((d) => {
        if (d) {
          setGeneral(d);
          setLogoPreview(d.logo_url || "");
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
  }, [activeTab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "general") {
        let logo_url = general.logo_url;

        if (logoFile) {
          setUploadingLogo(true);
          const ext = logoFile.name.split(".").pop();
          const path = `logos/brand-logo.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("site-assets")
            .upload(path, logoFile, { upsert: true });
          if (uploadError) throw new Error(uploadError.message);
          const { data: urlData } = supabase.storage
            .from("site-assets")
            .getPublicUrl(path);
          logo_url = urlData.publicUrl;
          setUploadingLogo(false);
        }

        await saveSetting("general", { ...general, logo_url });
        setGeneral((prev) => ({ ...prev, logo_url }));
        setLogoPreview(logo_url);
        setLogoFile(null);
      }
      if (activeTab === "contact") await saveSetting("contact", contact);
      if (activeTab === "about") await saveSetting("about", about);
      if (activeTab === "faq") await saveSetting("faq", { items: faqItems });
      if (activeTab === "returns") await saveSetting("returns", returns);
      toast.success("Saved successfully!");
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
      setUploadingLogo(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "contact", label: "Contact", icon: Mail },
    { id: "about", label: "About", icon: FileText },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "returns", label: "Returns", icon: RotateCcw },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-primary">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store configuration and content
        </p>
      </div>

      {/* Tabs */}
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
          {/* Brand Name */}
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
                    placeholder={
                      lang === "en"
                        ? "Royal Brands Fashion"
                        : lang === "ar"
                          ? "رويال براندز فاشن"
                          : "Royal Brands Fashion"
                    }
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Logo */}
          <Card className="bg-card border-border p-6 space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Brand Logo
            </h2>

            {/* Preview */}
            {logoPreview && (
              <div className="flex items-center gap-4">
                <img
                  src={logoPreview}
                  alt="Brand Logo"
                  className="h-16 w-auto object-contain border border-border rounded p-2 bg-background"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogoPreview("");
                    setLogoFile(null);
                    setGeneral({ ...general, logo_url: "" });
                  }}
                  className="text-destructive text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              </div>
            )}

            {/* Upload */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Upload New Logo
              </Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLogoFile(file);
                  setLogoPreview(URL.createObjectURL(file));
                }}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:border file:border-border
                  file:text-xs file:uppercase file:tracking-widest file:font-bold
                  file:bg-card file:text-primary
                  hover:file:bg-primary hover:file:text-primary-foreground
                  file:cursor-pointer file:transition-all"
              />
              <p className="text-[10px] text-muted-foreground">
                PNG, JPG, SVG — recommended 200×60px
              </p>
            </div>

            {/* Or paste URL */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Or Paste Logo URL
              </Label>
              <Input
                value={general.logo_url}
                onChange={(e) => {
                  setGeneral({ ...general, logo_url: e.target.value });
                  setLogoPreview(e.target.value);
                  setLogoFile(null);
                }}
                placeholder="https://..."
                className="bg-background border-border"
              />
            </div>
          </Card>
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
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Email
                </Label>
                <Input
                  value={contact.email}
                  onChange={(e) =>
                    setContact({ ...contact, email: e.target.value })
                  }
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Phone
                </Label>
                <Input
                  value={contact.phone}
                  onChange={(e) =>
                    setContact({ ...contact, phone: e.target.value })
                  }
                  className="bg-background border-border"
                />
              </div>
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
              Social Media Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["instagram", "facebook", "whatsapp"] as const).map((s) => (
                <div key={s} className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {s}
                  </Label>
                  <Input
                    value={contact[s as keyof typeof contact]}
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
                      Q (
                      {lang === "en"
                        ? "English"
                        : lang === "ar"
                          ? "Arabic"
                          : "Turkish"}
                      )
                    </Label>
                    <Input
                      value={item[`q_${lang}` as keyof typeof item]}
                      onChange={(e) => {
                        const updated = [...faqItems];
                        updated[i] = {
                          ...updated[i],
                          [`q_${lang}`]: e.target.value,
                        };
                        setFaqItems(updated);
                      }}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="bg-background border-border text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      A (
                      {lang === "en"
                        ? "English"
                        : lang === "ar"
                          ? "Arabic"
                          : "Turkish"}
                      )
                    </Label>
                    <Textarea
                      value={item[`a_${lang}` as keyof typeof item]}
                      onChange={(e) => {
                        const updated = [...faqItems];
                        updated[i] = {
                          ...updated[i],
                          [`a_${lang}`]: e.target.value,
                        };
                        setFaqItems(updated);
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
