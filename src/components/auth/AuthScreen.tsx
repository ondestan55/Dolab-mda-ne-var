import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Shirt,
  KeyRound,
  Inbox,
  ArrowLeft,
} from 'lucide-react';
import { registerUser, verifyEmailCode, resendEmailCode, loginUser } from '../../services/api';
import { AuthUser } from '../../types/wardrobe';

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser, token?: string) => void;
}

type AuthMode = 'login' | 'register' | 'verify';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 6-digit OTP state (never shown on screen, user types/pastes from their email)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback & State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Countdown timer for resending code
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMessage('Lütfen adınızı ve soyadınızı giriniz.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerUser(cleanName, cleanEmail, password);
      if (res.success) {
        if (res.isAdmin && res.user) {
          onLoginSuccess(res.user, res.token);
          return;
        }
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessNotice(`${cleanEmail} adresine 6 haneli güvenlik onay kodunuz gönderildi.`);
        setMode('verify');
        setResendCooldown(60);
      } else {
        setErrorMessage(res.error || 'Kayıt sırasında bir hata oluştu.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUser(cleanEmail, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user, res.token);
      } else if (res.requiresVerification) {
        setErrorMessage('E-posta adresiniz henüz onaylanmamış. Onay kodu e-posta adresinize gönderildi.');
        setMode('verify');
        setResendCooldown(60);
      } else {
        setErrorMessage(res.error || 'E-posta veya şifre hatalı.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToSubmit?: string) => {
    const fullCode = (codeToSubmit || otpDigits.join('')).trim();
    if (fullCode.length !== 6) {
      setErrorMessage('Lütfen e-postanıza gelen 6 haneli onay kodunun tamamını giriniz.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyEmailCode(email.trim().toLowerCase(), fullCode);
      if (res.success && res.user) {
        setSuccessNotice('E-posta adresiniz doğrulandı! Giriş yapılıyor...');
        setTimeout(() => {
          onLoginSuccess(res.user!, res.token);
        }, 600);
      } else {
        setErrorMessage(res.error || 'Girdiğiniz onay kodu geçersiz veya süresi dolmuş.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Doğrulama işlemi sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await resendEmailCode(email.trim().toLowerCase());
      if (res.success) {
        setSuccessNotice(`Yeni 6 haneli onay kodu ${email} adresine gönderildi. Lütfen gelen kutunuzu kontrol edin.`);
        setResendCooldown(60);
      } else {
        setErrorMessage(res.error || 'Yeni onay kodu gönderilemedi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Yeni onay kodu gönderilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && digit) {
      const completeCode = newDigits.join('');
      if (completeCode.length === 6) {
        handleVerifyOtp(completeCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    } else {
      otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleGuestLogin = () => {
    const guestUser: AuthUser = {
      id: 'usr_guest_demo',
      name: 'Misafir Kullanıcı',
      email: 'misafir@dolabim.ai',
      emailVerified: true,
      createdAt: Date.now(),
    };
    onLoginSuccess(guestUser, 'guest_token');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Editorial Decorative Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[420px] h-[420px] rounded-full bg-[#E8E2D7]/60 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[380px] h-[380px] rounded-full bg-[#E5DCCF]/50 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1C1917] text-[#FAF8F5] shadow-lg shadow-black/10 mb-4">
            <Shirt className="w-7 h-7" />
          </div>
          <h1 className="font-serif-editorial text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1917]">
            Dolabımda Ne Var
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-1.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#8C7A6B]" />
            Yapay zekâ destekli gardırop & stil asistanı
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E7E0D8] rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/[0.03]">
          {/* Tabs for Login vs Register */}
          {mode !== 'verify' && (
            <div className="flex rounded-xl bg-[#F5F2EB] p-1 mb-6 border border-[#E7E0D8]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Hesap Oluştur
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Notice */}
          {successNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Giriş Yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <span>Giriş Yap</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. REGISTER MODE */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Ad Soyad
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Şifre Belirleyin
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917] transition"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E7E0D8] text-xs text-[#78716C] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4A5320] shrink-0 mt-0.5" />
                <span>Kayıt olduğunuzda güvenlik onay kodunuz girdiğiniz e-posta adresine gönderilecektir.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Onay Kodu Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <span>Kayıt Ol ve Onay Kodu Al</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. VERIFICATION / OTP MODE (Code is NEVER shown on screen - sent to user's real email) */}
          {mode === 'verify' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-semibold text-[#1C1917]">E-posta Onay Kodu</h2>
                <p className="text-xs text-[#78716C] mt-1.5 leading-relaxed">
                  Güvenliğiniz için 6 haneli onay kodu <span className="font-semibold text-[#1C1917] underline">{email}</span> adresine gönderilmiştir.
                </p>
              </div>

              {/* Informational Email Delivery Notice - Note: The secret code is strictly NOT shown here */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E7E0D8] text-xs text-[#57534E] flex items-start gap-3">
                <Inbox className="w-4 h-4 text-[#8C7A6B] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Lütfen e-posta kutunuzun <strong>Gelen Kutusu</strong> ve varsa <strong>Spam / Gereksiz</strong> klasörünü kontrol ederek gelen 6 haneli kodu aşağıya giriniz.
                </div>
              </div>

              {/* 6 Digit OTP Inputs */}
              <div>
                <label className="block text-center text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-2.5">
                  6 Haneli Güvenlik Kodunu Giriniz
                </label>
                <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917] transition shadow-inner"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={isLoading || otpDigits.join('').length !== 6}
                className="w-full py-3 px-4 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Hesabı Doğrula ve Başla</span>
                  </>
                )}
              </button>

              {/* Resend and Change Email options */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#78716C]">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  className="hover:text-[#1C1917] disabled:opacity-50 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Tekrar gönder (${resendCooldown}s)` : 'Kodu Tekrar Gönder'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                    setSuccessNotice(null);
                  }}
                  className="hover:text-[#1C1917] underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  E-postayı Değiştir
                </button>
              </div>

              {/* Troubleshooting Notice */}
              <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E7E0D8] text-[11px] text-[#57534E] space-y-1.5 leading-relaxed">
                <div className="font-semibold flex items-center gap-1.5 text-[#1C1917]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8C7A6B]" />
                  E-posta Ulaşmadı mı?
                </div>
                <p>
                  1. Lütfen e-postanızın <strong>Spam / Gereksiz</strong> klasörünü kontrol ediniz.
                </p>
                <p>
                  2. E-posta gelmediyse, yukarıdaki <strong>Kodu Tekrar Gönder</strong> butonunu kullanabilir veya e-posta adresinizi düzeltebilirsiniz.
                </p>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E7E0D8]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#A8A29E] font-medium">veya</span>
            </div>
          </div>

          {/* Quick Demo / Guest Access */}
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2.5 px-4 bg-[#F5F2EB] hover:bg-[#ECE6DC] text-[#44403C] font-semibold text-xs sm:text-sm rounded-xl border border-[#E7E0D8] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#8C7A6B]" />
            <span>Giriş Yapmadan İncele (Hızlı Demo)</span>
          </button>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[#A8A29E] mt-6">
          Dolabımda Ne Var AI • Kişisel ve Güvenli Gardırop Yönetimi
        </p>
      </div>
    </div>
  );
};
