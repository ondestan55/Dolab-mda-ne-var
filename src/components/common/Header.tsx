import React from 'react';
import {
  Sparkles,
  CloudSun,
  Plus,
  Compass,
} from 'lucide-react';
import { WeatherInfo } from '../../types/wardrobe';

interface HeaderProps {
  weather: WeatherInfo | null;
  hasGeminiKey: boolean;
  onOpenAddModal: () => void;
  onOpenGenerate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  weather,
  hasGeminiKey,
  onOpenAddModal,
  onOpenGenerate,
}) => {
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
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3EDE6] border border-[#E7E0D8] text-xs text-[#44403C]">
            <CloudSun className="w-3.5 h-3.5 text-[#8C7A6B]" />
            <span className="font-medium">{weather.city}:</span>
            <span className="font-semibold">{weather.temperature}°C</span>
            <span className="text-[#8C7A6B]">({weather.condition})</span>
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
      </div>
    </header>
  );
};
