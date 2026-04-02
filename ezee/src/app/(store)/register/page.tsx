"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, ArrowLeft, RefreshCw, ShoppingBag, Truck, Shield, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Logo } from "@/components/common/logo";
import { useLanguageStore } from "@/store/language-store";

type Step = "form" | "verify";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuthStore();
  const { t } = useLanguageStore();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const autoSubmitRef = useRef<(() => void) | null>(null);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      toast.error(result.error || t.register.googleFailed);
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error(t.register.fillAllFields);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t.register.passwordsMismatch);
      return;
    }
    if (password.length < 6) {
      toast.error(t.register.passwordTooShort);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email, name }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(t.register.codeSent);
        setStep("verify");
        setResendTimer(60);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        toast.error(data.error || t.register.codeFailed);
      }
    } catch {
      toast.error(t.register.somethingWrong);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email, name }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t.register.newCodeSent);
        setResendTimer(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(data.error || t.register.resendFailed);
      }
    } catch {
      toast.error(t.register.somethingWrong);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newOtp.every((d) => d !== "")) {
      setTimeout(() => autoSubmitRef.current?.(), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      setTimeout(() => autoSubmitRef.current?.(), 100);
    }
  };

  autoSubmitRef.current = () => handleVerifyAndRegister();

  const handleVerifyAndRegister = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error(t.register.enterCode);
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await fetch("/api/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, code }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.verified) {
        toast.error(verifyData.error || t.register.invalidCode);
        setLoading(false);
        return;
      }

      const result = await register(name, email, password);
      if (result.success) {
        toast.success(t.register.accountCreated);
        router.push("/");
      } else {
        toast.error(result.error || t.register.registrationFailed);
      }
    } catch {
      toast.error(t.register.somethingWrong);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Left Side - Hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-600 via-primary to-indigo-800">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-16 right-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-16 left-10 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 rounded-full bg-white/5 blur-2xl"
          />
        </div>

        {/* Grid pattern */}
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

          {/* Center */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                Start your<br />shopping journey
              </h1>
              <p className="text-lg text-white/70 max-w-md leading-relaxed">
                Create your account and get access to exclusive deals, order tracking, and personalized recommendations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {[
                { icon: UserPlus, text: "Quick & easy registration" },
                { icon: Shield, text: t.login.securePayments },
                { icon: Truck, text: t.login.freeDelivery },
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

          {/* Bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-4"
          >
            <div className="flex -space-x-2">
              {[
                "bg-gradient-to-br from-emerald-400 to-emerald-600",
                "bg-gradient-to-br from-sky-400 to-sky-600",
                "bg-gradient-to-br from-amber-400 to-amber-600",
                "bg-gradient-to-br from-rose-400 to-rose-600",
              ].map((bg, i) => (
                <div
                  key={i}
                  className={`h-9 w-9 rounded-full ${bg} border-2 border-indigo-700 flex items-center justify-center text-xs font-bold text-white`}
                >
                  {["J", "A", "R", "L"][i]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">{t.login.trustedBy}</p>
              <p className="text-xs text-white/50">{t.login.joinCommunity}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-6 bg-gradient-to-br from-background via-background to-primary/5 relative">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl translate-y-1/2 -translate-x-1/2" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] lg:max-w-[480px] xl:max-w-[520px] relative z-10"
        >
          {/* Mobile Logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Logo size="lg" />
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 lg:p-8 xl:p-10 shadow-xl shadow-black/5 dark:shadow-black/20">
            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-6">
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{t.register.title}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.register.subtitle}
                    </p>
                  </div>

                  {/* Google Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 lg:h-12 rounded-xl font-medium lg:text-base border-border/50 hover:bg-accent/50 hover:border-border transition-all cursor-pointer"
                    onClick={handleGoogleSignup}
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
                    {t.register.signUpGoogle}
                  </Button>

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card/80 px-3 text-muted-foreground font-medium tracking-wider">
                        {t.register.orRegisterEmail}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-medium">{t.register.fullName}</Label>
                      <Input
                        id="name"
                        placeholder={t.register.namePlaceholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 rounded-xl bg-accent/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium">{t.register.email}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t.register.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl bg-accent/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm font-medium">{t.register.password}</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t.register.passwordPlaceholder}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 rounded-xl pr-10 bg-accent/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg cursor-pointer hover:bg-accent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">{t.register.confirmPassword}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder={t.register.confirmPlaceholder}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 rounded-xl bg-accent/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 lg:h-12 rounded-xl font-semibold lg:text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 cursor-pointer group"
                      disabled={loading}
                    >
                      {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.register.sendingCode}</>
                      ) : (
                        <>
                          {t.register.continue}
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-5 pt-5 border-t border-border/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t.register.haveAccount}{" "}
                      <Link href="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors cursor-pointer">
                        {t.register.signIn}
                      </Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center shadow-lg shadow-primary/20">
                        <Mail className="h-7 w-7" />
                      </div>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold">{t.register.verifyEmail}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.register.codeSentTo}
                    </p>
                    <p className="text-sm font-semibold text-primary mt-0.5">{email}</p>
                  </div>

                  {/* OTP Input */}
                  <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="h-13 w-12 rounded-xl border-2 border-border/50 bg-accent/30 text-center text-lg font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    ))}
                  </div>

                  <Button
                    className="w-full h-11 lg:h-12 rounded-xl font-semibold lg:text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20 transition-all duration-300 cursor-pointer mb-4"
                    disabled={loading || otp.join("").length !== 6}
                    onClick={handleVerifyAndRegister}
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.register.verifying}</>
                    ) : (
                      t.register.verifyCreate
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("form");
                        setOtp(["", "", "", "", "", ""]);
                      }}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {t.register.back}
                    </button>

                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendTimer > 0 || loading}
                      className={`flex items-center gap-1 transition-colors ${
                        resendTimer > 0
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-primary hover:text-primary/80 cursor-pointer"
                      }`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {resendTimer > 0 ? t.register.resendIn.replace("{count}", String(resendTimer)) : t.register.resendCode}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
