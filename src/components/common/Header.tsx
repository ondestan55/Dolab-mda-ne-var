import {
  Sparkles,
  CloudSun,
  Plus,
  Compass,
  MapPin,
  RefreshCw,
  Download,
} from 'lucide-react';
import { WeatherInfo, AuthUser } from '../../types/wardrobe';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { LogOut, CheckCircle } from 'lucide-react';

interface HeaderProps {
  weather: WeatherInfo | null;
  hasGeminiKey: boolean;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenAddModal: () => void;
  onOpenGenerate: () => void;
  onRefreshLocation?: () => void;
  isDetectingLocation?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  weather,
  hasGeminiKey,
  currentUser,
  onLogout,
  onOpenAddModal,
  onOpenGenerate,
  onRefreshLocation,
  isDetectingLocation,
}) => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(today);

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E7E0D8] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-all">
      {/* Date & Weather Pill */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-[#8C7A6B]">
            {formattedDate}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-medium text-[#292524]">
              Bugün ne giymek istersin?
            </span>
          </div>
        </div>

        {weather && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3EDE6] border border-[#E7E0D8] text-xs text-[#44403C]">
            <MapPin className="w-3.5 h-3.5 text-[#4A5320] shrink-0" />
            <span className="font-semibold truncate max-w-[150px]">{weather.city}</span>
            <span className="text-[#8C7A6B]">•</span>
            <span className="font-bold">{weather.temperature}°C</span>
            <span className="text-[#8C7A6B] truncate max-w-[120px]">({weather.condition})</span>
            {onRefreshLocation && (
              <button
                onClick={onRefreshLocation}
                disabled={isDetectingLocation}
                className="ml-1 p-0.5 text-[#8C7A6B] hover:text-[#1C1917] rounded-full hover:bg-black/5 transition"
                title="Konumu ve hava durumunu otomatik güncelle"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin text-[#1C1917]' : ''}`}
                />
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Status & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Gemini AI Status Badge */}
        <div
          className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            hasGeminiKey
              ? 'bg-[#EBF3ED] text-[#2D5A38] border-[#CFDFD3]'
              : 'bg-[#F5F2ED] text-[#786C60] border-[#E5DFD7]'
          }`}
          title={
            hasGeminiKey
              ? 'Gemini 3.8 Flash Vision ve Stilist AI aktif'
              : 'AI anahtarı bağlı değil, yerel stil motoru devrede'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              hasGeminiKey ? 'bg-[#2D5A38] animate-pulse' : 'bg-[#9C8F83]'
            }`}
          />
          {hasGeminiKey ? 'Gemini AI Aktif' : 'Yerel Stil Motoru'}
        </div>

        {/* PWA Install Button */}
        {isInstallable && (
          <button
            onClick={promptInstall}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#4A5320] text-[#FAF8F5] hover:bg-[#3B4219] transition shadow-xs active:scale-98"
            title="Uygulamayı Cihazınıza Yükleyin"
          >
            <Download className="w-3.5 h-3.5 text-[#E6DEC8]" />
            <span className="hidden sm:inline">Uygulamayı Yükle</span>
          </button>
        )}

        {/* Generate Outfit Quick Button */}
        <button
          onClick={onOpenGenerate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#F0EBE1] hover:bg-[#E8E1D3] text-[#2C2723] border border-[#DCD3C7] transition shadow-xs active:scale-98"
        >
          <Sparkles className="w-4 h-4 text-[#7A6B53]" />
          <span>Kombin Öner</span>
        </button>

        {/* Add Clothing Primary Button */}
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#1C1917] hover:bg-[#2E2A27] text-[#FAF8F5] transition shadow-sm active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Kıyafet Ekle</span>
        </button>

        {/* User Account & Logout */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#E7E0D8]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F0EBE1] border border-[#E7E0D8] text-xs">
              <span className="font-semibold text-[#1C1917] max-w-[100px] sm:max-w-[130px] truncate">
                {currentUser.name}
              </span>
              {currentUser.role === 'admin' && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#1C1917] text-[#FAF8F5] text-[9px] font-bold tracking-wider uppercase">
                  Admin
                </span>
              )}
              {currentUser.emailVerified && (
                <span title="E-posta onaylandı" className="text-emerald-700 flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 fill-emerald-100 text-emerald-600" />
                </span>
              )}
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-[#8C7A6B] hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
