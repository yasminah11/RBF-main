import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ornament } from "@/components/Ornament";
import { User, Mail, Lock, Loader2, ArrowRight, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nContext";

type AuthMode = "login" | "register";

export default function Auth() {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Prototype mode: Always succeed after a short delay
    setTimeout(() => {
      if (mode === "register") {
        toast.success((t as any).auth.accountCreated, {
          description: "Your account is ready. You can now sign in."
        });
        setMode("login");
      } else {
        toast.success((t as any).auth.welcomeBack, {
          description: (t as any).auth.personalBoutique
        });
        navigate("/");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container-luxury py-8 md:py-12 flex justify-center items-center min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card/40 backdrop-blur-xl border border-primary/10 p-8 md:p-12 shadow-luxury relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="text-center mb-10">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
            {mode === "login" ? <User className="text-primary w-8 h-8" /> : <UserPlus className="text-primary w-8 h-8" />}
          </div>
          <p className="text-xs sm:text-[10px] uppercase tracking-[0.4em] text-primary mb-3 font-bold">
            {mode === "login" ? (t as any).auth.loginTag : (t as any).auth.registerTag}
          </p>
          <h1 className="font-display text-5xl sm:text-4xl text-cream">
            {mode === "login" ? (t as any).auth.loginTitle : (t as any).auth.registerTitle}
          </h1>
          <Ornament className="mt-4" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-xs sm:text-[10px] uppercase tracking-widest text-muted-foreground ml-1">{(t as any).auth.fullName}</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    required={mode === "register"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Lara Royal"
                    className="w-full bg-background/40 border border-border/20 px-12 py-4 text-base sm:text-sm focus:outline-none focus:border-primary transition-all text-cream rounded-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs sm:text-[10px] uppercase tracking-widest text-muted-foreground ml-1">{(t as any).auth.email}</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@royalbrands.com"
                className="w-full bg-background/40 border border-border/20 px-12 py-4 text-base sm:text-sm focus:outline-none focus:border-primary transition-all text-cream rounded-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-[10px] uppercase tracking-widest text-muted-foreground ml-1">{(t as any).auth.password}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background/40 border border-border/20 px-12 py-4 text-base sm:text-sm focus:outline-none focus:border-primary transition-all text-cream rounded-none"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="group relative w-full bg-primary text-primary-foreground py-5 text-xs sm:text-[10px] uppercase tracking-[0.3em] font-bold overflow-hidden transition-all hover:shadow-gold disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto relative z-10" />
            ) : (
              <div className="flex items-center justify-center gap-3 relative z-10">
                <span>{mode === "login" ? (t as any).auth.signInBtn : (t as any).auth.createAccountBtn}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            )}
            <div className="absolute inset-0 bg-primary-glow translate-y-full transition-transform group-hover:translate-y-0" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-xs sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
          >
            {mode === "login" ? (t as any).auth.noAccount : (t as any).auth.hasAccount}
          </button>
        </div>

        <p className="mt-10 text-center text-[10px] sm:text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          {(t as any).auth.terms}
        </p>
      </motion.div>
    </div>
  );
}
