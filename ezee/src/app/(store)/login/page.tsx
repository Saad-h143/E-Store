"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ShoppingBag, Truck, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Logo } from "@/components/common/logo";
import { useLanguageStore } from "@/store/language-store";

export default function LoginPage() {
  const { t } = useLanguageStore();
  const router = useRouter();
  const { login, loginWithGoogle } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      toast.error(result.error || t.login.googleFailed);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t.login.fillAllFields);
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success(t.login.welcomeBackToast);
      const { user } = useAuthStore.getState();
      if (user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } else {
      toast.error(result.error || t.login.loginFailed);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Left Side - Hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-purple-600 to-purple-800">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-2xl"
          />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Top - Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Ezee Store</span>
            </div>
          </motion.div>

          {/* Center - Main message */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                {t.login.tagline}
              </h1>
              <p className="text-lg text-white/70 max-w-md leading-relaxed">
                {t.login.description}
              </p>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {[
                { icon: Truck, text: t.login.freeDelivery },
                { icon: Shield, text: t.login.securePayments },
                { icon: ShoppingBag, text: t.login.wideRange },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors duration-300">
                    <feature.icon className="h-5 w-5 text-white/90" />
                  </div>
                  <span className="text-sm text-white/80 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom - Testimonial / social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-4"
          >
            <div className="flex -space-x-2">
              {[
                "bg-gradient-to-br from-blue-400 to-blue-600",
                "bg-gradient-to-br from-green-400 to-green-600",
                "bg-gradient-to-br from-orange-400 to-orange-600",
                "bg-gradient-to-br from-pink-400 to-pink-600",
              ].map((bg, i) => (
                <div
                  key={i}
                  className={`h-9 w-9 rounded-full ${bg} border-2 border-purple-700 flex items-center justify-center text-xs font-bold text-white`}
                >
                  {["A", "S", "M", "K"][i]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">Trusted by 10,000+ customers</p>
              <p className="text-xs text-white/50">Join our growing community</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12 bg-gradient-to-br from-background via-background to-primary/5 relative">
        {/* Subtle background elements */}
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl translate-y-1/2 -translate-x-1/2" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] lg:max-w-[480px] xl:max-w-[520px] relative z-10"
        >
          {/* Mobile Logo (visible only on mobile) */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Logo size="lg" />
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 lg:p-10 xl:p-12 shadow-xl shadow-black/5 dark:shadow-black/20">
            {/* Header */}
            <div className="mb-8 lg:mb-10">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{t.login.welcomeBack}</h1>
              <p className="text-sm lg:text-base text-muted-foreground mt-1.5 lg:mt-2">
                {t.login.subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t.login.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.login.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 lg:h-12 rounded-xl bg-accent/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t.login.password}
                  </Label>
                  <Link
                    href="#"
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
                  >
                    {t.login.forgotPassword}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.login.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 lg:h-12 rounded-xl pr-10 bg-accent/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 lg:h-12 rounded-xl font-semibold lg:text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 cursor-pointer group"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {t.login.signIn}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6 lg:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card/80 px-3 text-muted-foreground font-medium tracking-wider">
                  {t.login.orContinueWith}
                </span>
              </div>
            </div>

            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 lg:h-12 rounded-xl font-medium lg:text-base border-border/50 hover:bg-accent/50 hover:border-border transition-all cursor-pointer"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {t.login.continueWithGoogle}
            </Button>

            <div className="mt-6 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                {t.login.noAccount}{" "}
                <Link
                  href="/register"
                  className="text-primary font-semibold hover:text-primary/80 transition-colors cursor-pointer"
                >
                  {t.login.createAccount}
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom note - mobile only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground lg:hidden"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> {t.login.secure}
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" /> {t.login.freeDelivery}
            </span>
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" /> {t.login.bestPrices}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
