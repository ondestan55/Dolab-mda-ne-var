import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  Download,
  Upload,
  Trash2,
  Database,
  CloudSun,
  ShieldCheck,
  Check,
  Compass,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { UserPreferences, WeatherInfo } from '../../types/wardrobe';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => Promise<void>;
  weather: WeatherInfo | null;
  onRefreshWeather: (city: string) => Promise<void>;
  hasGeminiKey: boolean;
  onLoadDemoData: () => Promise<void>;
  onRemoveDemoData: () => Promise<void>;
  onClearAllData: () => Promise<void>;
  onExportBackup: () => Promise<void>;
  onImportBackup: (jsonStr: string) => Promise<void>;
  itemCount: number;
  outfitCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  weather,
  onRefreshWeather,
  hasGeminiKey,
  onLoadDemoData,
  onRemoveDemoData,
  onClearAllData,
  onExportBackup,
  onImportBackup,
  itemCount,
  outfitCount,
}) => {
  const [city, setCity] = useState(preferences.city || 'İstanbul');
  const [genderPreference, setGenderPreference] = useState(
    preferences.genderPreference || 'unisex'
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isUpdatingCity, setIsUpdatingCity] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const popularCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Londra', 'Paris'];

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingCity(true);
    try {
      await onUpdatePreferences({
        ...preferences,
        city,
        genderPreference: genderPreference as any,
      });
      await onRefreshWeather(city);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingCity(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await onImportBackup(text);
        alert('Yedek başarıyla içe aktarıldı.');
      } catch {
        alert('Geçersiz yedek dosyası.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
          Uygulama Yapılandırması
        </span>
        <h2 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight">
          Ayarlar ve Profil
        </h2>
        <p className="text-xs sm:text-sm text-[#786C60] mt-1">
          Konum ve hava durumu tercihlerinizi yönetin, verilerinizi yedekleyin veya demo parçaları düzenleyin.
        </p>
      </div>

      {/* 1. Location & Weather Preference */}
      <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E7E0D8] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E7E0D8] pb-3">
          <CloudSun className="w-5 h-5 text-[#8C7A6B]" />
          <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
            Şehir ve Canlı Hava Durumu
          </h3>
        </div>

        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">
              Bulunduğunuz Şehir
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="ör. İstanbul, Ankara, İzmir, Londra..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] focus:outline-hidden focus:border-[#1C1917]"
              />
              <button
                type="submit"
                disabled={isUpdatingCity}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shrink-0"
              >
                {isUpdatingCity ? 'Güncelleniyor...' : 'Kaydet & Hava Durumunu Güncelle'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-[#8C7A6B]">Hızlı Seç:</span>
            {popularCities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCity(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                  city.toLowerCase() === c.toLowerCase()
                    ? 'bg-[#1C1917] text-[#FAF8F5] border-[#1C1917]'
                    : 'bg-white text-[#5C5248] border-[#D5C9BE] hover:bg-[#F3EDE6]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {weather && (
            <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E7E0D8] text-xs text-[#5C5248] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#1C1917]">{weather.city}</span>
                <span className="mx-2">•</span>
                <span>{weather.condition}</span>
                <span className="mx-2">•</span>
                <span className="font-bold">{weather.temperature}°C</span>
              </div>
              <span className="text-[10px] text-[#8C7A6B]">
                {weather.isEstimated ? 'Varsayılan' : 'Canlı Open-Meteo'}
              </span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Ayarlar başarıyla kaydedildi.</span>
            </div>
          )}
        </form>
      </div>

      {/* 2. AI Connection Status */}
      <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E7E0D8] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8C7A6B]" />
            <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
              Yapay Zekâ Entegrasyon Durumu
            </h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              hasGeminiKey
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {hasGeminiKey ? 'Gemini 3.8 Flash Aktif' : 'Yerel Moda Geçildi'}
          </span>
        </div>

        <p className="text-xs text-[#5C5248] leading-relaxed">
          {hasGeminiKey ? (
            <>
              Kıyafet fotoğraflarınız <strong>Gemini 3.8 Flash Vision</strong> ile incelenir ve kombin önerileriniz lüks moda stilisti mantığıyla server-side olarak işlenir. API anahtarınız sunucu tarafında güvenle korunur.
            </>
          ) : (
            <>
              Gemini API anahtarı yapılandırılmadığında uygulama otomatik olarak kesintisiz çalışan <strong>yerel kural tabanlı stil motoru</strong> ile kombin önerileri üretir ve manuel kıyafet girişine olanak sağlar.
            </>
          )}
        </p>
      </div>

      {/* 3. Demo Data Controls */}
      <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E7E0D8] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E7E0D8] pb-3">
          <Compass className="w-5 h-5 text-[#8C7A6B]" />
          <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
            Örnek Dolap (Demo Verisi)
          </h3>
        </div>

        <p className="text-xs text-[#5C5248] leading-relaxed">
          Uygulamayı hemen test edebilmeniz için 22 parçalık zengin kıyafet koleksiyonu ve 6 hazır kombin bulunmaktadır. Demo verileri gerçek kullanıcı kayıtlarınızla karışmaz ve istediğiniz zaman temizlenebilir.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onLoadDemoData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs"
          >
            <Compass className="w-4 h-4 text-[#E6DEC8]" />
            <span>Örnek Dolabı Yükle (22 Parça)</span>
          </button>

          <button
            onClick={onRemoveDemoData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-[#5C5248] border border-[#D5C9BE] hover:bg-[#F3EDE6] transition"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Örnek Verileri Temizle</span>
          </button>
        </div>
      </div>

      {/* 4. Data Backup & Privacy Notice */}
      <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E7E0D8] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E7E0D8] pb-3">
          <Database className="w-5 h-5 text-[#8C7A6B]" />
          <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
            Yerel Veri Saklama ve Yedekleme
          </h3>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F0EBE1] border border-[#DDD4C7] text-xs text-[#5C5248] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[#1C1917]">
            <ShieldCheck className="w-4 h-4 text-[#4A5320]" />
            <span>Gizlilik & Güvenlik Bildirimi</span>
          </div>
          <p>
            Kıyafet fotoğraflarınız ve kişisel kayıtlarınız yalnızca tarayıcınızın <strong>güvenli yerel IndexedDB veritabanında</strong> saklanır. Verilerinizi başka bir cihaza aktarmak için aşağıdaki JSON yedekleme özelliğini kullanabilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onExportBackup}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-[#1C1917] border border-[#D5C9BE] hover:bg-[#F3EDE6] transition"
          >
            <Download className="w-4 h-4 text-[#8C7A6B]" />
            <span>Verilerimi İndir (JSON Yedek)</span>
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-[#1C1917] border border-[#D5C9BE] hover:bg-[#F3EDE6] transition cursor-pointer">
            <Upload className="w-4 h-4 text-[#8C7A6B]" />
            <span>Yedekten Geri Yükle</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 hover:bg-rose-50 transition ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Tüm Verileri Sıfırla</span>
          </button>
        </div>

        {/* Clear All Data Confirm */}
        {showClearConfirm && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-3">
            <p className="text-xs font-semibold">
              Tüm kıyafet, kombin ve plan kayıtlarınız tamamen silinecek. Onaylıyor musunuz?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-xs font-medium"
              >
                Vazgeç
              </button>
              <button
                onClick={async () => {
                  await onClearAllData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold"
              >
                Evet, Sıfırla
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Future Roadmap & Pro Subscription Transparency Notice */}
      <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E7E0D8] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#8C7A6B]" />
            <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
              Gelecek Sürüm & Abonelik Yol Haritası
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAE2D5] text-[#5C5248] font-semibold">
            Geliştirme Aşamasında
          </span>
        </div>

        <p className="text-xs text-[#5C5248] leading-relaxed">
          Şu anda <strong>Dolabımda Ne Var AI MVP</strong> sürümündesiniz. Gelecek ticari sürümde aşağıdaki özellikler kullanıma sunulacaktır:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-white border border-[#E7E0D8] space-y-1">
            <span className="text-xs font-bold text-[#1C1917] block">
              Google & Firebase Girişi
            </span>
            <p className="text-[11px] text-[#786C60]">
              Tüm cihazlarınız arasında anında senkronize olan güvenli bulut gardırop.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#E7E0D8] space-y-1">
            <span className="text-xs font-bold text-[#1C1917] block">
              Sanal Deneme Kabini
            </span>
            <p className="text-[11px] text-[#786C60]">
              Kıyafetlerinizi kendi avatarınız üzerinde fotogerçekçi canlandırma.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#E7E0D8] space-y-1">
            <span className="text-xs font-bold text-[#1C1917] block">
              Sınırsız AI Stil Danışmanı
            </span>
            <p className="text-[11px] text-[#786C60]">
              Özel davetler, seyahat bavulu hazırlama ve kapsül dolap planlama.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
