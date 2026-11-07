"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Wine, Eye, EyeOff, Loader2, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Basic client-side check as fallback to middleware
    if (document.cookie.includes('adminAuth=')) {
      router.push('/admin/dashboard');
    } else if (document.cookie.includes('deliveryAuth=')) {
      router.push('/delivery/dashboard');
    }
  }, [router]);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const parseResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    const text = await response.text();
    if (response.status === 404) {
      throw new Error("API endpoint not found (404). Please ensure the backend server is running.");
    }
    if (response.status === 500) {
      throw new Error("Server internal error (500). Please try again or check backend service.");
    }
    throw new Error(text.slice(0, 80).replace(/<[^>]*>?/gm, "").trim() || `Server error (${response.status})`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await parseResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Failed to login");
      }

      if (data.role === "admin") {
          document.cookie = `adminAuth=${data.token}; path=/; max-age=86400`;
          router.push('/admin/dashboard');
      } else if (data.role === "delivery") {
          document.cookie = `deliveryAuth=${data.token}; path=/; max-age=86400`;
          router.push('/delivery/dashboard');
      } else {
          throw new Error("Unauthorized role for this portal");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/forget-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email }),
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");
      setForgotPasswordStep(2);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/verify-forget-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, otp }),
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || "Failed to verify OTP");
      setResetToken(data.resetToken);
      setForgotPasswordStep(3);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password: newPassword }),
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || "Failed to reset password");
      setIsForgotPassword(false);
      setForgotPasswordStep(1);
      setOtp("");
      setNewPassword("");
      setPassword("");
      setError("Password reset successfully. Please log in."); // Actually using error state to show success message (simplest)
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center text-white overflow-hidden relative bg-black">
      
      {/* FULLSCREEN BACKGROUND VIDEO */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <video
          ref={videoRef}
          src="/daaru.mp4"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.9 }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-[#1A0005]/60 pointer-events-none"></div>
      </div>

      {/* SOUND TOGGLE */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleMute}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all duration-300 group"
        >
          {isMuted ? <VolumeX className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
        </button>
      </div>

      {/* CONTENT WRAPPER */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row lg:justify-between min-h-screen px-6 lg:px-16 xl:px-24">
        
        {/* LEFT COLUMN - CAPTION & BRANDING */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center pt-16 pb-8 lg:py-12 order-1 lg:order-none">
          <div className="max-w-xl">
            <div className="inline-block px-4 py-1.5 border border-[#C92A4A]/30 rounded-full bg-black/40 backdrop-blur-md mb-8">
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#C92A4A] uppercase">DaaruDoor • Admin Portal</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-light text-white mb-6 tracking-wide leading-tight drop-shadow-lg">
              Raise the Standard.
            </h1>
            
            <h2 className="text-xl md:text-3xl text-white/90 font-light mb-6 tracking-wide drop-shadow-md">
              Premium spirits. Seamless delivery.
            </h2>
            
            <p className="text-sm md:text-lg text-[#A1A1AA] font-light leading-relaxed max-w-md drop-shadow-md">
              Manage your DaaruDoor experience with confidence.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - LOGIN CARD */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end pb-16 lg:py-12 order-2 lg:order-none">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="bg-[#111111]/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#C92A4A] to-transparent opacity-60"></div>

              <div className="flex items-center gap-4 mb-10 justify-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C92A4A] to-[#4A0012] flex items-center justify-center shadow-lg shadow-[#800020]/40 border border-white/20">
                  <Wine className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold tracking-[0.2em] text-white drop-shadow-md">DAARUDOOR</span>
              </div>

              <div className="mb-10 text-center">
                <h2 className="text-2xl font-light text-white mb-2 tracking-wide">
                  {isForgotPassword ? (forgotPasswordStep === 1 ? "Reset Password" : forgotPasswordStep === 2 ? "Verify OTP" : "New Password") : "Welcome Back"}
                </h2>
                <p className="text-sm text-[#A1A1AA]/80 font-light">
                  {isForgotPassword ? "Follow the steps to reset your password" : "Sign in to access your admin portal"}
                </p>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-sm mt-4 py-2.5 px-4 rounded-xl border backdrop-blur-md ${error.includes("success") ? "text-green-300 bg-green-950/40 border-green-500/20" : "text-red-300 bg-red-950/40 border-red-500/20"}`}
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {!isForgotPassword ? (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="relative group">
                    <label className="block text-[10px] font-semibold text-[#A1A1AA] mb-2 uppercase tracking-[0.15em] ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@daarudoor.com"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#C92A4A] focus:border-[#C92A4A] transition-all duration-300 backdrop-blur-sm"
                        required
                      />
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="flex items-center justify-between mb-2 ml-1 mr-1">
                      <label className="block text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-[0.15em]">
                        Password
                      </label>
                      <button type="button" onClick={() => { setIsForgotPassword(true); setError(null); }} className="text-[10px] font-medium text-[#C92A4A] hover:text-white transition-colors tracking-wide">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#C92A4A] focus:border-[#C92A4A] transition-all duration-300 backdrop-blur-sm"
                        required
                      />
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none"></div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-2"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center ml-2 mt-4">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        id="remember"
                        className="w-4 h-4 rounded border-white/20 bg-black/40 checked:bg-[#C92A4A] checked:border-[#C92A4A] focus:ring-[#C92A4A] focus:ring-offset-0 transition-all appearance-none cursor-pointer"
                      />
                      <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" style={{ opacity: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <label htmlFor="remember" className="ml-3 text-xs text-[#A1A1AA] font-light cursor-pointer hover:text-white transition-colors">
                      Remember me for 30 days
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group overflow-hidden rounded-2xl p-[1px] mt-8"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#800020] via-[#C92A4A] to-[#800020] opacity-80 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient-x"></span>
                    <div className="relative bg-gradient-to-b from-[#A52A45]/90 to-[#4A0012]/90 flex items-center justify-center w-full px-4 py-4 rounded-2xl transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(201,42,74,0.5)]">
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <span className="text-sm font-bold text-white tracking-[0.2em] uppercase">Sign In</span>
                      )}
                    </div>
                  </button>
                </form>
              ) : (
                <form onSubmit={forgotPasswordStep === 1 ? handleForgotPassword : forgotPasswordStep === 2 ? handleVerifyOTP : handleResetPassword} className="space-y-6">
                  {forgotPasswordStep === 1 && (
                    <div className="relative group">
                      <label className="block text-[10px] font-semibold text-[#A1A1AA] mb-2 uppercase tracking-[0.15em] ml-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Registered Email"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#C92A4A] focus:border-[#C92A4A] transition-all duration-300 backdrop-blur-sm"
                          required
                        />
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none"></div>
                      </div>
                    </div>
                  )}

                  {forgotPasswordStep === 2 && (
                    <div className="relative group">
                      <label className="block text-[10px] font-semibold text-[#A1A1AA] mb-2 uppercase tracking-[0.15em] ml-1">
                        Enter OTP
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="6-digit OTP"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#C92A4A] focus:border-[#C92A4A] transition-all duration-300 backdrop-blur-sm tracking-[0.5em] text-center"
                          required
                        />
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none"></div>
                      </div>
                    </div>
                  )}

                  {forgotPasswordStep === 3 && (
                    <div className="relative group">
                      <label className="block text-[10px] font-semibold text-[#A1A1AA] mb-2 uppercase tracking-[0.15em] ml-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New Password"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#C92A4A] focus:border-[#C92A4A] transition-all duration-300 backdrop-blur-sm"
                          required
                        />
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none"></div>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-2"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 mt-8">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full relative group overflow-hidden rounded-2xl p-[1px]"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-[#800020] via-[#C92A4A] to-[#800020] opacity-80 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient-x"></span>
                      <div className="relative bg-gradient-to-b from-[#A52A45]/90 to-[#4A0012]/90 flex items-center justify-center w-full px-4 py-4 rounded-2xl transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(201,42,74,0.5)]">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <span className="text-sm font-bold text-white tracking-[0.2em] uppercase">
                            {forgotPasswordStep === 1 ? "Send OTP" : forgotPasswordStep === 2 ? "Verify OTP" : "Reset Password"}
                          </span>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(false); setForgotPasswordStep(1); setError(null); }}
                      className="text-xs text-[#A1A1AA] hover:text-white transition-colors text-center mt-2"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        input[type="checkbox"]:checked + svg {
          opacity: 1 !important;
        }
      `}} />
    </div>
  );
}
