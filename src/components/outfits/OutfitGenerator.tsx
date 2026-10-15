import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  CloudSun,
  Palette,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sliders,
  Heart,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import {
  ClothingItem,
  Outfit,
  WeatherInfo,
  STYLES,
  OCCASIONS,
} from '../../types/wardrobe';
import { generateWardrobeOutfits } from '../../services/api';
import { OutfitCard } from './OutfitCard';

interface OutfitGeneratorProps {
  items: ClothingItem[];
  savedOutfits: Outfit[];
  weather: WeatherInfo | null;
  hasGeminiKey: boolean;
  onSaveOutfit: (outfit: Outfit) => Promise<void>;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelectOutfit: (outfit: Outfit) => void;
  onScheduleOutfit: (outfit: Outfit) => void;
}

export const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({
  items,
  savedOutfits,
  weather,
  hasGeminiKey,
  onSaveOutfit,
  onToggleFavorite,
  onSelectOutfit,
  onScheduleOutfit,
}) => {
  // Wizard Preferences
  const [occasion, setOccasion] = useState<string>('Günlük Hayat');
  const [customOccasion, setCustomOccasion] = useState<string>('');
  const [style, setStyle] = useState<string>('Smart Casual');
  const [season, setSeason] = useState<string>('Dört Mevsim');
  const [weatherCondition, setWeatherCondition] = useState<string>(
    weather?.conditionCategory || 'Ilık'
  );
  const [temperature, setTemperature] = useState<number>(
    weather?.temperature ?? 19
  );
  const [colorPreference, setColorPreference] = useState<string>(
    'Nötr & Toprak Tonları'
  );
  const [includeFavorites, setIncludeFavorites] = useState<boolean>(true);
  const [excludeRecentlyWorn, setExcludeRecentlyWorn] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfits, setGeneratedOutfits] = useState<Outfit[]>([]);
  const [generalAdvice, setGeneralAdvice] = useState<string>('');
  const [missingCategories, setMissingCategories] = useState<string[]>([]);
  const [isAiPowered, setIsAiPowered] = useState<boolean>(hasGeminiKey);
  const [engineNotice, setEngineNotice] = useState<string>('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Quick occasions
  const quickOccasions = [
    { label: 'İşe Gidiyorum', val: 'İş' },
    { label: 'Günlük Dışarı', val: 'Günlük Hayat' },
    { label: 'Arkadaş Buluşması', val: 'Sosyal Etkinlik' },
    { label: 'Özel Davet & Akşam', val: 'Özel Gün' },
    { label: 'Seyahate Çıkıyorum', val: 'Seyahat' },
    { label: 'Spor & Aktivite', val: 'Spor' },
  ];

  const colorThemes = [
    'Nötr & Toprak Tonları (Krem, Bej, Haki)',
    'Monokrom (Siyah, Beyaz, Gri)',
    'Canlı & Kontrast (Mavi, Bordo vb.)',
    'Fark Etmez (Serbest Uyum)',
  ];

  const itemsMap = new Map(items.map((i) => [i.id, i]));

  const handleGenerate = async () => {
    if (items.length < 2) {
      alert('Kombin oluşturmak için gardırobunuzda en az 2 parça bulunmalıdır.');
      return;
    }

    setIsGenerating(true);
    setMissingCategories([]);
    setEngineNotice('');

    try {
      const activeOccasion = customOccasion.trim() ? customOccasion : occasion;

      const response = await generateWardrobeOutfits(items, {
        occasion: activeOccasion,
        style,
        season,
        weather: weatherCondition,
        temperature,
        colorPreference,
        includeFavorites,
        excludeRecentlyWorn,
        customPrompt,
      });

      setGeneratedOutfits(response.outfits);
      setGeneralAdvice(response.generalAdvice || '');
      setMissingCategories(response.missingCategories || []);
      setIsAiPowered(response.isAiPowered);
      if (response.message) {
        setEngineNotice(response.message);
      }
    } catch (err: any) {
      console.error('Outfit generation error:', err);
      alert('Kombin oluşturulurken hata meydana geldi: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSingleOutfit = async (outfit: Outfit, e: React.MouseEvent) => {
    e.stopPropagation();
    await onSaveOutfit(outfit);
    setSavedIds((prev) => new Set(prev).add(outfit.id));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
          Kişisel Stil Küratörü
        </span>
        <h2 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight">
          AI Kombin Oluşturucu
        </h2>
        <p className="text-xs sm:text-sm text-[#786C60] mt-1 max-w-2xl">
          Yapay zekâ, yalnızca dolabınızda bulunan gerçek kıyafetlerinizi renk teorisi, hava durumu ve seçtiğiniz ortama göre kusursuz kombinler halinde bir araya getirir.
        </p>
      </div>

      {/* Preferences Wizard Box */}
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#E7E0D8] p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#8C7A6B]" />
            <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
              Kombin Tercihlerinizi Belirleyin
            </h3>
          </div>
          <span className="text-xs text-[#8C7A6B]">
            Dolap: <strong className="text-[#1C1917]">{items.length}</strong> parça
          </span>
        </div>

        {/* 1. Occasion Selector */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider">
            1. Nereye Gidiyorsunuz? (Kullanım Ortamı)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {quickOccasions.map((occ) => (
              <button
                key={occ.val}
                type="button"
                onClick={() => {
                  setOccasion(occ.val);
                  setCustomOccasion('');
                }}
                className={`p-3 rounded-2xl text-xs font-medium text-left border transition ${
                  occasion === occ.val && !customOccasion
                    ? 'bg-[#1C1917] text-[#FAF8F5] border-[#1C1917] shadow-xs'
                    : 'bg-white text-[#5C5248] border-[#D5C9BE] hover:bg-[#F3EDE6]'
                }`}
              >
                <span className="block font-semibold">{occ.label}</span>
                <span className="text-[10px] opacity-75">{occ.val}</span>
              </button>
            ))}
          </div>

          <div className="pt-1">
            <input
              type="text"
              value={customOccasion}
              onChange={(e) => setCustomOccasion(e.target.value)}
              placeholder="Veya özel bir etkinlik yazın: ör. Galeri açılışı, brunch, iş mülakatı..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
            />
          </div>
        </div>

        {/* 2. Style & Season & Weather Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Style */}
          <div>
            <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
              2. İstenen Stil
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-xs font-medium text-[#1C1917] focus:outline-hidden"
            >
              {STYLES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Weather Condition */}
          <div>
            <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Hava Koşulu</span>
              {weather && (
                <span className="text-[10px] text-[#4A5320] font-normal">
                  {weather.city}: {weather.temperature}°C
                </span>
              )}
            </label>
            <select
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-xs font-medium text-[#1C1917] focus:outline-hidden"
            >
              <option value="Sıcak">Sıcak (Yazlık)</option>
              <option value="Ilık">Ilık (Bahar / Geçiş)</option>
              <option value="Serin">Serin (Ceketli / Katmanlı)</option>
              <option value="Soğuk">Soğuk (Kaban / Mont)</option>
              <option value="Yağmurlu">Yağmurlu (Su Geçirmez)</option>
              <option value="Rüzgarlı">Rüzgarlı</option>
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
              Sıcaklık: {temperature}°C
            </label>
            <input
              type="range"
              min="-5"
              max="40"
              value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="w-full accent-[#1C1917] cursor-pointer mt-2"
            />
          </div>

          {/* Color Preference */}
          <div>
            <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
              Renk Paleti
            </label>
            <select
              value={colorPreference}
              onChange={(e) => setColorPreference(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-xs font-medium text-[#1C1917] focus:outline-hidden"
            >
              {colorThemes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggles: Favorites, Exclude worn */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#E7E0D8]">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-[#44403C]">
            <input
              type="checkbox"
              checked={includeFavorites}
              onChange={(e) => setIncludeFavorites(e.target.checked)}
              className="w-4 h-4 rounded-md accent-[#1C1917]"
            />
            <span>Favori parçalarımı öncelikle değerlendir</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-[#44403C]">
            <input
              type="checkbox"
              checked={excludeRecentlyWorn}
              onChange={(e) => setExcludeRecentlyWorn(e.target.checked)}
              className="w-4 h-4 rounded-md accent-[#1C1917]"
            />
            <span>Son günlerde giyilmiş kıyafetleri hariç tut</span>
          </label>
        </div>

        {/* Generate CTA Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#786C60] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#8C7A6B]" />
            <span>
              {hasGeminiKey
                ? 'Gemini 3.8 Flash akıllı gardırop modeli ile oluşturulur.'
                : 'Yerel stil algoritması ile oluşturulur.'}
            </span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold transition shadow-md ${
              isGenerating
                ? 'bg-[#8C7A6B] text-white cursor-not-allowed'
                : 'bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] active:scale-98'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Kombinler Hesaplanıyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[#E6DEC8]" />
                <span>Kombinleri Oluştur</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Missing Categories Alert if applicable */}
      {missingCategories.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Dolabınızda Eksik Parçalar Var:</span>
            <p className="mt-0.5 text-amber-800">
              Kombin bütünlüğü için şu kategorilerden en az birer parça eklemeniz önerilir:{' '}
              <strong>{missingCategories.join(', ')}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Engine Notice if fallback */}
      {engineNotice && (
        <div className="p-3 rounded-2xl bg-[#F0EBE1] border border-[#DDD4C7] text-xs text-[#5C5248]">
          {engineNotice}
        </div>
      )}

      {/* Generated Results Area */}
      {generatedOutfits.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#8C7A6B]">
                Özel Seçki
              </span>
              <h3 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
                Önerilen Kombin Alternatifleri ({generatedOutfits.length})
              </h3>
            </div>

            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#5C5248] hover:bg-[#EAE2D5] transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Alternatifleri Yenile</span>
            </button>
          </div>

          {generalAdvice && (
            <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#E5DCCF] text-xs text-[#44403C] leading-relaxed italic">
              "{generalAdvice}"
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedOutfits.map((outfit) => {
              const isAlreadySaved =
                savedIds.has(outfit.id) ||
                savedOutfits.some((s) => s.name === outfit.name);

              return (
                <div key={outfit.id} className="relative">
                  <OutfitCard
                    outfit={outfit}
                    itemsMap={itemsMap}
                    onSelect={onSelectOutfit}
                    onToggleFavorite={onToggleFavorite}
                    onSchedule={(o, e) => {
                      e.stopPropagation();
                      onScheduleOutfit(o);
                    }}
                    isSaved={isAlreadySaved}
                    onSave={handleSaveSingleOutfit}
                  />
                  {isAlreadySaved && (
                    <div className="absolute top-2 left-2 z-20">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-800 text-white shadow-xs">
                        Kaydedildi ✓
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
