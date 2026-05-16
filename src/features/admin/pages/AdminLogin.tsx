import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nContext";

export function AdminLogin() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Prototype mode: Always succeed and redirect to admin dashboard
    setTimeout(() => {
      toast.success(t.auth.welcomeBack);
      navigate("/admin");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      
      <Card className="w-full max-w-md shadow-2xl border-border bg-card/50 backdrop-blur-xl relative z-10 mx-auto">
        <CardHeader className="space-y-2 text-center pb-6 sm:pb-8 border-b border-border/50">
          <CardTitle className="font-display text-3xl sm:text-4xl text-primary tracking-[0.1em]">ROYAL BRANDS</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t.admin.sidebar.portal}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-8">
          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@royalbrands.com"
                className="bg-background border-border h-11 sm:h-12 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border h-11 sm:h-12 focus:ring-primary"
              />
            </div>
            <Button type="submit" className="w-full h-11 sm:h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold font-bold uppercase tracking-widest text-xs" disabled={loading}>
              {loading ? "..." : t.auth.signInBtn}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Restricted Access • Royal Brands Maison</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
