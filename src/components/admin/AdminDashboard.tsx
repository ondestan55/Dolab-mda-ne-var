import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Mail,
  KeyRound,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  AlertTriangle,
  Server,
  Layers,
  Sparkles,
  ExternalLink,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  AdminUserItem,
  AdminVerificationItem,
  AdminSmtpSettings,
  ClothingItem,
} from '../../types/wardrobe';
import {
  fetchAdminUsers,
  fetchAdminVerifications,
  approveUserManually,
  fetchAdminSmtp,
  saveAdminSmtp,
  sendAdminTestEmail,
} from '../../services/api';

interface AdminDashboardProps {
  currentUserEmail: string;
  items: ClothingItem[];
  onOpenAddItem: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUserEmail,
  items,
}) => {
  const [activeTab, setActiveTab] = useState<'verifications' | 'users' | 'smtp' | 'system'>('verifications');

  // Data states
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [verifications, setVerifications] = useState<AdminVerificationItem[]>([]);
  const [smtpSettings, setSmtpSettings] = useState<AdminSmtpSettings>({
    host: '',
    port: 465,
    secure: true,
    user: '',
    isConfigured: false,
    from: '',
  });

  // SMTP Form state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');

  // Status & loading
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, verifRes, smtpRes] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminVerifications(),
        fetchAdminSmtp(),
      ]);

      if (usersRes.success) setUsers(usersRes.users);
      if (verifRes.success) setVerifications(verifRes.verifications);
      if (smtpRes.success && smtpRes.smtp) {
        setSmtpSettings(smtpRes.smtp);
        setSmtpHost(smtpRes.smtp.host || 'smtp.gmail.com');
        setSmtpPort(smtpRes.smtp.port || 465);
        setSmtpSecure(smtpRes.smtp.secure ?? true);
        setSmtpUser(smtpRes.smtp.user || currentUserEmail);
        setSmtpFrom(smtpRes.smtp.from || `"Dolabımda Ne Var" <${currentUserEmail}>`);
      }
    } catch (err: any) {
      console.error('Admin data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleApproveUser = async (email: string) => {
    try {
      const res = await approveUserManually(email);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `${email} kullanıcısı tek tıkla onaylandı ve hesabı aktif edildi!`,
        });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Onaylama başarısız oldu.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    setActionMessage(null);

    try {
      const res = await saveAdminSmtp({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
      });

      if (res.success) {
        if (res.warning) {
          setActionMessage({ type: 'warning', text: res.warning });
        } else {
          setActionMessage({
            type: 'success',
            text: res.message || 'SMTP ayarları başarıyla doğrulandı ve kaydedildi!',
          });
        }
        loadData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'SMTP kaydedilemedi.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleSendTestMail = async () => {
    setIsSendingTest(true);
    setActionMessage(null);
    try {
      const res = await sendAdminTestEmail(currentUserEmail);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: res.message || `${currentUserEmail} adresine test onay e-postası başarıyla gönderildi!`,
        });
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Test e-postası gönderilemedi.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] text-[#FAF8F5] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#44403C]/40 relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] w-64 h-64 rounded-full bg-[#8C7A6B]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B342F] text-[#E6DAC8] text-xs font-semibold tracking-wider uppercase border border-[#524941]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F3EFE6]" />
              Süper Yönetici Paneli
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-semibold tracking-tight text-[#FAF8F5]">
              Yönetici Kontrol Merkezi
            </h1>
            <p className="text-xs sm:text-sm text-[#A8A29E]">
              Oturum Sahibi: <span className="text-[#FAF8F5] font-mono font-medium underline">{currentUserEmail}</span> (Admin)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2E2A27] hover:bg-[#3D3834] text-[#FAF8F5] border border-[#524941] transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Verileri Yenile</span>
            </button>
            <button
              onClick={handleSendTestMail}
              disabled={isSendingTest}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#E6DAC8] hover:bg-[#D8C7B0] text-[#1C1917] transition shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingTest ? 'Gönderiliyor...' : 'Test Maili Gönder'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#44403C]/60">
          <div className="bg-[#292524]/70 p-3.5 rounded-2xl border border-[#44403C]/40">
            <div className="text-[11px] text-[#A8A29E] uppercase tracking-wider font-medium">Toplam Kullanıcı</div>
            <div className="text-xl sm:text-2xl font-bold text-[#FAF8F5] mt-0.5">{users.length}</div>
          </div>
          <div className="bg-[#292524]/70 p-3.5 rounded-2xl border border-[#44403C]/40">
            <div className="text-[11px] text-[#A8A29E] uppercase tracking-wider font-medium">Onay Bekleyenler</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-0.5">{verifications.length}</div>
          </div>
          <div className="bg-[#292524]/70 p-3.5 rounded-2xl border border-[#44403C]/40">
            <div className="text-[11px] text-[#A8A29E] uppercase tracking-wider font-medium">SMTP Durumu</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${smtpSettings.isConfigured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-xs font-semibold text-[#FAF8F5]">
                {smtpSettings.isConfigured ? 'Canlı Aktif' : 'Varsayılan / Kurulmadı'}
              </span>
            </div>
          </div>
          <div className="bg-[#292524]/70 p-3.5 rounded-2xl border border-[#44403C]/40">
            <div className="text-[11px] text-[#A8A29E] uppercase tracking-wider font-medium">Gardırop Kataloğu</div>
            <div className="text-xl sm:text-2xl font-bold text-[#FAF8F5] mt-0.5">{items.length} Parça</div>
          </div>
        </div>
      </div>

      {/* Action Notification Box */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-start justify-between gap-3 animate-in fade-in duration-150 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : actionMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-semibold underline hover:opacity-80"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E7E0D8] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'verifications'
              ? 'bg-[#1C1917] text-[#FAF8F5] shadow-xs'
              : 'text-[#78716C] hover:bg-[#F5F2EB]'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Onay Bekleyenler & Kodlar</span>
          {verifications.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {verifications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'smtp'
              ? 'bg-[#1C1917] text-[#FAF8F5] shadow-xs'
              : 'text-[#78716C] hover:bg-[#F5F2EB]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>E-posta & SMTP Yapılandırma</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#1C1917] text-[#FAF8F5] shadow-xs'
              : 'text-[#78716C] hover:bg-[#F5F2EB]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kayıtlı Kullanıcılar ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'system'
              ? 'bg-[#1C1917] text-[#FAF8F5] shadow-xs'
              : 'text-[#78716C] hover:bg-[#F5F2EB]'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Sistem & Gardırop Denetimi</span>
        </button>
      </div>

      {/* 1. TAB: VERIFICATIONS */}
      {activeTab === 'verifications' && (
        <div className="bg-white border border-[#E7E0D8] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#8C7A6B]" />
                Onay Kodu Bekleyen Kullanıcılar
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                Kullanıcı kayıt olduğunda üretilen 6 haneli güvenlik kodları ve tek tıkla manuel onaylama aracı.
              </p>
            </div>
            <button
              onClick={loadData}
              className="text-xs font-semibold text-[#1C1917] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Yenile
            </button>
          </div>

          {verifications.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#FAF8F5] border border-dashed border-[#D6CEC3]">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-[#1C1917]">Bekleyen Onay Kodu Yok</div>
              <p className="text-xs text-[#78716C] mt-1 max-w-sm mx-auto">
                Şu anda onay kodu bekleyen herhangi bir kullanıcı kaydı bulunmamaktadır. Tüm hesaplar doğrulanmış durumda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#E7E0D8] text-[11px] uppercase tracking-wider text-[#78716C]">
                    <th className="py-3 px-3">Kullanıcı</th>
                    <th className="py-3 px-3">E-posta</th>
                    <th className="py-3 px-3">6 Haneli Onay Kodu</th>
                    <th className="py-3 px-3">Kalan Süre</th>
                    <th className="py-3 px-3 text-right">Yönetici İşlemi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {verifications.map((v) => (
                    <tr key={v.email} className="hover:bg-[#FAF8F5] transition">
                      <td className="py-3 px-3 font-medium text-[#1C1917]">{v.name}</td>
                      <td className="py-3 px-3 font-mono text-xs text-[#44403C]">{v.email}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-sm font-bold tracking-widest bg-amber-100 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-200/80">
                          {v.code}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#78716C]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {v.minutesLeft} dakika
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleApproveUser(v.email)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Tek Tıkla Onayla</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. TAB: SMTP CONFIGURATION */}
      {activeTab === 'smtp' && (
        <div className="bg-white border border-[#E7E0D8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#8C7A6B]" />
              E-posta Gönderim & Canlı SMTP Yapılandırması
            </h2>
            <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
              Kullanıcıların kayıt olduklarında onay kodlarının gerçek Gmail veya kurumsal posta kutularına ulaşması için SMTP kimlik bilgilerini buradan kaydedebilirsiniz.
            </p>
          </div>

          {/* Quick Guide for Gmail App Password */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="font-semibold flex items-center gap-1.5 text-sm text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-700" />
              Gmail ile Canlı E-posta Gönderme Rehberi (Önerilen)
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-amber-900/90 leading-relaxed">
              <li>
                Google Hesabınızda <strong>2 Adımlı Doğrulama</strong>'nın açık olduğundan emin olun.
              </li>
              <li>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline inline-flex items-center gap-1 hover:text-black"
                >
                  Google Uygulama Şifreleri Sayfası <ExternalLink className="w-3 h-3" />
                </a>{' '}
                adresine gidin.
              </li>
              <li>Uygulama adı olarak "Dolabim AI" yazın ve 16 haneli Uygulama Şifresi üretin.</li>
              <li>Aşağıdaki forma kullanıcı adı olarak Gmail adresinizi, şifre olarak ise oluşturulan 16 haneli şifreyi girip kaydedin.</li>
            </ol>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSmtpHost('smtp.gmail.com');
                setSmtpPort(465);
                setSmtpSecure(true);
                setSmtpUser(currentUserEmail);
                setSmtpFrom(`"Dolabımda Ne Var" <${currentUserEmail}>`);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-[#F0EBE1] border border-[#D6CEC3] text-[#1C1917] transition cursor-pointer"
            >
              Gmail SMTP Ayarlarını Doldur
            </button>
            <button
              type="button"
              onClick={() => {
                setSmtpHost('smtp-relay.brevo.com');
                setSmtpPort(587);
                setSmtpSecure(false);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-[#F0EBE1] border border-[#D6CEC3] text-[#1C1917] transition cursor-pointer"
            >
              Brevo (Sendinblue) SMTP
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveSmtp} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  SMTP Sunucusu (Host)
                </label>
                <input
                  type="text"
                  required
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Port
                </label>
                <input
                  type="number"
                  required
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(parseInt(e.target.value, 10))}
                  placeholder="465"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  SMTP Kullanıcı / E-posta
                </label>
                <input
                  type="text"
                  required
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="ornek@gmail.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  SMTP Şifresi / Google Uygulama Şifresi
                </label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="•••• •••• •••• •••• (16 haneli kod)"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                Gönderen Başlığı (From Header)
              </label>
              <input
                type="text"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                placeholder='"Dolabımda Ne Var AI" <ornek@gmail.com>'
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D6CEC3] bg-[#FAF8F5]/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={isSavingSmtp}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1C1917] hover:bg-[#2E2A27] text-[#FAF8F5] font-semibold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSmtp ? 'Doğrulanıyor & Kaydediliyor...' : 'SMTP Ayarlarını Test Et & Kaydet'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendTestMail}
                disabled={isSendingTest}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#F0EBE1] border border-[#D6CEC3] text-[#1C1917] font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{currentUserEmail} Adresine Test Gönder</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. TAB: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#E7E0D8] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#8C7A6B]" />
              Kayıtlı Kullanıcı Listesi
            </h2>
            <span className="text-xs text-[#78716C]">Toplam: {users.length} Hesap</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E7E0D8] text-[11px] uppercase tracking-wider text-[#78716C]">
                  <th className="py-3 px-3">Ad Soyad</th>
                  <th className="py-3 px-3">E-posta</th>
                  <th className="py-3 px-3">Yetki / Rol</th>
                  <th className="py-3 px-3">E-posta Durumu</th>
                  <th className="py-3 px-3">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {users.map((u) => (
                  <tr key={u.id || u.email} className="hover:bg-[#FAF8F5] transition">
                    <td className="py-3 px-3 font-medium text-[#1C1917]">{u.name}</td>
                    <td className="py-3 px-3 font-mono text-xs text-[#44403C]">{u.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.role === 'admin'
                            ? 'bg-[#1C1917] text-[#FAF8F5]'
                            : 'bg-[#F0EBE1] text-[#57534E]'
                        }`}
                      >
                        {u.role === 'admin' ? '👑 Yönetici' : 'Kullanıcı'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          u.emailVerified ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {u.emailVerified ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Doğrulandı
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            Bekliyor
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-[#78716C]">
                      {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB: SYSTEM AUDIT */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E7E0D8] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-[#1C1917] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8C7A6B]" />
              Gardırop Kataloğu & Yapay Zekâ İstatistikleri
            </h3>
            <p className="text-xs text-[#78716C]">
              Sistemde kayıtlı kıyafet parçalarının kategori ve model dağılımı.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-[#FAF8F5]">
                <span className="font-medium text-[#44403C]">Toplam Kıyafet Parçası:</span>
                <span className="font-bold text-[#1C1917]">{items.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-[#FAF8F5]">
                <span className="font-medium text-[#44403C]">Görsel Segmentasyon / Çıkartma Modu:</span>
                <span className="font-semibold text-emerald-700">Gardrops Sticker (Aktif)</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-[#FAF8F5]">
                <span className="font-medium text-[#44403C]">Yapay Zekâ Görüş Modeli:</span>
                <span className="font-semibold text-[#1C1917]">Gemini 3.8 Flash (Multimodal)</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E7E0D8] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-[#1C1917] flex items-center gap-2">
              <Server className="w-4 h-4 text-[#8C7A6B]" />
              Sistem Güvenlik & Doğrulama Politikası
            </h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Kullanıcı parolaları güvenli olarak işlenir, 6 haneli OTP kodları 15 dakika boyunca geçerlidir. Yönetici (`xceyceyx@gmail.com`), herhangi bir kullanıcıyı e-posta kutusuna ihtiyaç duymadan doğrudan panel üzerinden onaylama yetkisine sahiptir.
            </p>

            <div className="p-3.5 rounded-2xl bg-[#F7F4EE] border border-[#E7E0D8] text-xs text-[#57534E] space-y-1.5">
              <div className="font-semibold text-[#1C1917]">Süper Yönetici Bilgileri:</div>
              <div>E-posta: <strong>xceyceyx@gmail.com</strong></div>
              <div>Varsayılan Yetki: <strong>Süper Yönetici (Admin)</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
