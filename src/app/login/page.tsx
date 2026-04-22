"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

const COLLAGE = [
  "https://images.pexels.com/photos/11912130/pexels-photo-11912130.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/31762405/pexels-photo-31762405.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/8482816/pexels-photo-8482816.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/32780059/pexels-photo-32780059.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/4254159/pexels-photo-4254159.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/8470798/pexels-photo-8470798.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
];

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    if (digits.length >= 7) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length >= 4) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length >= 1) return `(${digits}`;
    return "";
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep("otp");
      otpRefs.current[0]?.focus();
    }, 900);
  };

  const handleOtpChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== "") && !verifying) {
      setVerifying(true);
      setTimeout(() => router.push("/"), 700);
    }
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Collage background */}
      <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 grid-rows-3 gap-1 opacity-30">
        {COLLAGE.map((url, i) => (
          <div key={i} className="relative overflow-hidden">
            <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" loading={i < 3 ? "eager" : "lazy"} />
          </div>
        ))}
      </div>
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/80 to-black/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8941F] shadow-lg shadow-yellow-900/40 mb-3">
              <ShieldCheck className="w-9 h-9 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gold-text mb-2">RevoRoof AI</h1>
          <p className="text-white text-base md:text-lg font-medium mb-1">Revolution Roofing</p>
          <p className="text-[#D4AF37]/80 text-xs md:text-sm italic tracking-wide">
            "You Don't Need A Ladder — You Need A Network"
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50 border-[#D4AF37]/20">
          {step === "phone" ? (
            <form onSubmit={handleSendCode}>
              <label htmlFor="phone" className="block text-sm text-gray-300 mb-2 font-medium">
                Sign in with your phone
              </label>
              <div className="relative mb-6">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]" />
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(404) 555-0123"
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-lg pl-11 pr-4 py-4 text-white text-lg placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none transition"
                  required
                  minLength={14}
                />
              </div>
              <button
                type="submit"
                disabled={sending || phone.length < 14}
                className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Sending code...
                  </>
                ) : (
                  <>
                    Send verification code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-500 mt-4">
                We'll text a 6-digit code. Standard message rates may apply.
              </p>
            </form>
          ) : (
            <div>
              <button
                onClick={() => {
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                }}
                className="text-xs text-gray-400 hover:text-[#D4AF37] mb-4"
              >
                ← Change phone number
              </button>
              <label className="block text-sm text-gray-300 mb-1 font-medium">Enter the 6-digit code</label>
              <p className="text-xs text-gray-500 mb-4">
                Sent to <span className="text-white">{phone}</span>
              </p>
              <div className="flex gap-2 mb-6 justify-between">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                    disabled={verifying}
                    className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold bg-gray-900/80 border border-gray-700 rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition disabled:opacity-60"
                  />
                ))}
              </div>
              {verifying ? (
                <div className="flex items-center justify-center gap-2 text-[#D4AF37] py-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </div>
              ) : (
                <p className="text-center text-xs text-gray-500">
                  Enter any 6 digits to tour the demo
                </p>
              )}
              <button
                onClick={() => setStep("phone")}
                className="block w-full text-center text-sm text-gray-400 hover:text-[#D4AF37] mt-4 underline underline-offset-2"
              >
                Resend code
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Demo mode — any phone number + any 6-digit code will sign you in.
        </p>
      </div>
    </div>
  );
}
