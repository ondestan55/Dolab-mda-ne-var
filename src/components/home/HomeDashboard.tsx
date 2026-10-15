import React from 'react';
import {
  Sparkles,
  CloudSun,
  Plus,
  Layers,
  BookmarkCheck,
  CalendarDays,
  Heart,
  ArrowRight,
  PlusCircle,
  Eye,
  Shirt,
  Compass,
} from 'lucide-react';
import {
  ClothingItem,
  Outfit,
  OutfitPlan,
  WeatherInfo,
  CATEGORY_LABELS,
} from '../../types/wardrobe';

interface HomeDashboardProps {
  items: ClothingItem[];
  outfits: Outfit[];
  plans: OutfitPlan[];
  weather: WeatherInfo | null;
  onOpenAddModal: () => void;
  onOpenGenerate: () => void;
  onNavigateToWardrobe: () => void;
  onNavigateToOutfits: () => void;
  onNavigateToCalendar: () => void;
  onSelectItem: (item: ClothingItem) => void;
  onSelectOutfit: (outfit: Outfit) => void;
  onLoadDemoData: () => void;
  onLogWear: (outfitId: string, itemIds: string[]) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  items,
  outfits,
  plans,
  weather,
  onOpenAddModal,
  onOpenGenerate,
  onNavigateToWardrobe,
  onNavigateToOutfits,
  onNavigateToCalendar,
  onSelectItem,
  onSelectOutfit,
  onLoadDemoData,
  onLogWear,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const itemsMap = new Map(items.map((i) => [i.id, i]));

  // Today's planned outfit if any, otherwise first favorite outfit, or first outfit
  const todaysPlan = plans.find((p) => p.date === todayStr);
  const featuredOutfit = todaysPlan
    ? outfits.find((o) => o.id === todaysPlan.outfitId)
    : outfits.find((o) => o.isFavorite) || outfits[0];

  const recentItems = [...items]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  const favoriteOutfits = outfits.filter((o) => o.isFavorite).slice(0, 3);
  const favoriteItemsCount = items.filter((i) => i.isFavorite).length;

  // Unpaired discovery ideas: pairs top and bottom that have 0 or lowest wear
  const discoveryTop = items.find((i) => i.category === 'top' && (i.wearCount || 0) < 5);
  const discoveryBottom = items.find(
    (i) => i.category === 'bottom' && (i.wearCount || 0) < 5 && i.id !== discoveryTop?.id
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Onboarding Welcome Banner if empty */}
      {items.length === 0 && (
        <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-br from-[#F5EFEB] to-[#EAE0D3] border border-[#DDD3C5] shadow-xs space-y-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
                Hoş Geldiniz • Dolabımda Ne Var AI
              </span>
              <h2 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] leading-tight">
                Dolabındaki Potansiyeli Keşfet.
              </h2>
              <p className="text-xs sm:text-sm text-[#5C5248] leading-relaxed">
                Sahip olduğunuz kıyafetlerin fotoğraflarını yükleyin, yapay zekâ analiz etsin; hava durumuna ve ortama en uygun şık kombinleri saniyeler içinde hazırlasın.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                onClick={onOpenAddModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Kendi Dolabımı Oluştur</span>
              </button>

              <button
                onClick={onLoadDemoData}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-white text-[#1C1917] border border-[#D5C9BE] hover:bg-[#FAF8F5] transition shadow-2xs"
              >
                <Compass className="w-4 h-4 text-[#8C7A6B]" />
                <span>Örnek Dolabı İncele (22 Parça)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Hero Banner with Quick Outfit CTA */}
      <div className="relative rounded-3xl bg-[#1C1917] text-[#FAF8F5] p-6 sm:p-8 overflow-hidden shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#E6DEC8]">
            Günlük Stil Danışmanınız
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl font-bold tracking-tight">
            Bugün ne giymek istersin?
          </h2>
          <p className="text-xs sm:text-sm text-[#D8CCC4] leading-relaxed">
            {weather
              ? `${weather.city} için hava şu anda ${weather.temperature}°C ve ${weather.condition}.`
              : 'Günün koşullarına uygun şık ve konforlu bir stil belirleyin.'}{' '}
            Dolabındaki parçalarla sana özel kombin oluşturalım.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenGenerate}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-[#FAF8F5] text-[#1C1917] hover:bg-[#F0EBE1] transition shadow-xs active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-[#8C7A6B]" />
              <span>Bana Kombin Öner</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/15 text-[#FAF8F5] border border-white/15 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Kıyafet Yükle</span>
            </button>
          </div>
        </div>

        {/* Ambient background accent */}
        <div className="absolute -right-12 -bottom-16 w-80 h-80 rounded-full bg-[#4A5320]/20 blur-3xl pointer-events-none" />
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clothes */}
        <div
          onClick={onNavigateToWardrobe}
          className="p-5 rounded-3xl bg-[#FAF8F5] border border-[#E7E0D8] hover:border-[#D0C4B8] hover:shadow-xs transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-[#8C7A6B]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Dolaptaki Kıyafet
            </span>
            <Layers className="w-4 h-4 group-hover:text-[#1C1917] transition" />
          </div>
          <span className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] block">
            {items.length}
          </span>
          <span className="text-[11px] text-[#786C60] flex items-center gap-1 group-hover:underline">
            Tüm dolabı gör <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Saved Outfits */}
        <div
          onClick={onNavigateToOutfits}
          className="p-5 rounded-3xl bg-[#FAF8F5] border border-[#E7E0D8] hover:border-[#D0C4B8] hover:shadow-xs transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-[#8C7A6B]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Kaydedilen Kombin
            </span>
            <BookmarkCheck className="w-4 h-4 group-hover:text-[#1C1917] transition" />
          </div>
          <span className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] block">
            {outfits.length}
          </span>
          <span className="text-[11px] text-[#786C60] flex items-center gap-1 group-hover:underline">
            Kombinlere bak <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Weekly Plans */}
        <div
          onClick={onNavigateToCalendar}
          className="p-5 rounded-3xl bg-[#FAF8F5] border border-[#E7E0D8] hover:border-[#D0C4B8] hover:shadow-xs transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-[#8C7A6B]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Planlanan Kombin
            </span>
            <CalendarDays className="w-4 h-4 group-hover:text-[#1C1917] transition" />
          </div>
          <span className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] block">
            {plans.length}
          </span>
          <span className="text-[11px] text-[#786C60] flex items-center gap-1 group-hover:underline">
            Haftalık takvim <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Favorite Items */}
        <div
          onClick={onNavigateToWardrobe}
          className="p-5 rounded-3xl bg-[#FAF8F5] border border-[#E7E0D8] hover:border-[#D0C4B8] hover:shadow-xs transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-[#8C7A6B]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Favori Parçalar
            </span>
            <Heart className="w-4 h-4 text-rose-500 fill-current" />
          </div>
          <span className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] block">
            {favoriteItemsCount}
          </span>
          <span className="text-[11px] text-[#786C60] flex items-center gap-1 group-hover:underline">
            Favorileri incele <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Today's Featured Outfit Card */}
      {featuredOutfit && (
        <div className="bg-[#FAF8F5] rounded-3xl border border-[#E7E0D8] p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E0D8] pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
                {todaysPlan ? 'Bugün İçin Planlanan' : 'Günün Kombin Önerisi'}
              </span>
              <h3 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1C1917]">
                {featuredOutfit.name}
              </h3>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EAE2D5] text-[#5C5248]">
                {featuredOutfit.style}
              </span>
              <span className="text-xs text-[#8C7A6B]">
                {featuredOutfit.occasion}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Pieces Collage */}
            <div className="md:col-span-5">
              <div className="grid grid-cols-2 gap-2 bg-[#F3EDE6] p-2.5 rounded-2xl border border-[#E7E0D8]">
                {featuredOutfit.itemIds.slice(0, 4).map((id, idx) => {
                  const it = itemsMap.get(id);
                  if (!it) return null;
                  return (
                    <div
                      key={id + '_' + idx}
                      onClick={() => onSelectItem(it)}
                      className="aspect-4/5 rounded-xl overflow-hidden bg-white border border-[#E7E0D8] cursor-pointer hover:opacity-90 transition relative group"
                    >
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-black/60 text-white truncate max-w-[90%]">
                        {it.subcategory}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation & Action */}
            <div className="md:col-span-7 space-y-4">
              <p className="text-xs sm:text-sm text-[#44403C] leading-relaxed">
                {featuredOutfit.description}
              </p>

              {featuredOutfit.colorHarmonyReasoning && (
                <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#E7E0D8] text-xs text-[#5C5248]">
                  <strong className="text-[#1C1917] block mb-0.5">Renk & Doku Uyumu:</strong>
                  {featuredOutfit.colorHarmonyReasoning}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    onLogWear(featuredOutfit.id, featuredOutfit.itemIds);
                    alert('Kombin bugün giyildi olarak kaydedildi (+1)!');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 text-[#E6DEC8]" />
                  <span>Bugün Giydim (+1)</span>
                </button>

                <button
                  onClick={() => onSelectOutfit(featuredOutfit)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[#5C5248] hover:bg-[#EAE2D5] transition"
                >
                  <Eye className="w-4 h-4" />
                  <span>Kombin Detayını Gör</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recently Added Items Section */}
      {recentItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
                Gardırop Güncellemeleri
              </span>
              <h3 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
                Son Eklenen Kıyafetler
              </h3>
            </div>
            <button
              onClick={onNavigateToWardrobe}
              className="text-xs font-semibold text-[#1C1917] hover:underline flex items-center gap-1"
            >
              Tümünü Gör ({items.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="bg-[#FAF8F5] rounded-2xl border border-[#E7E0D8] p-2 hover:border-[#D0C4B8] hover:shadow-xs transition cursor-pointer group"
              >
                <div className="aspect-4/5 rounded-xl overflow-hidden bg-white mb-2">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-104 transition duration-300"
                  />
                </div>
                <span className="text-[10px] font-semibold text-[#8C7A6B] uppercase block">
                  {CATEGORY_LABELS[item.category]}
                </span>
                <h4 className="font-serif-editorial text-xs font-bold text-[#1C1917] truncate mt-0.5">
                  {item.name}
                </h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wardrobe Discovery Tip: Pairing Unused Pieces */}
      {discoveryTop && discoveryBottom && (
        <div className="p-6 rounded-3xl bg-[#F0EBE1] border border-[#DDD4C7] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4A5320]" />
              <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
                Henüz Birlikte Denemediğin Parçalar
              </h3>
            </div>
            <span className="text-xs text-[#786C60]">Akıllı Keşif</span>
          </div>

          <p className="text-xs text-[#5C5248]">
            Dolabınızdaki <strong>{discoveryTop.name}</strong> ile <strong>{discoveryBottom.name}</strong> parçalarını henüz bir arada giymediniz. Bu iki parça stil ve renk tonları bakımından zahmetsiz bir uyum yakalayabilir.
          </p>

          <div className="flex items-center gap-4">
            <div
              onClick={() => onSelectItem(discoveryTop)}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#D5C9BE] cursor-pointer hover:border-[#1C1917] transition"
            >
              <img
                src={discoveryTop.imageUrl}
                alt={discoveryTop.name}
                className="w-10 h-12 rounded-lg object-cover"
              />
              <span className="text-xs font-semibold text-[#1C1917] max-w-[120px] truncate">
                {discoveryTop.name}
              </span>
            </div>

            <span className="text-xs text-[#8C7A6B] font-bold">+</span>

            <div
              onClick={() => onSelectItem(discoveryBottom)}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#D5C9BE] cursor-pointer hover:border-[#1C1917] transition"
            >
              <img
                src={discoveryBottom.imageUrl}
                alt={discoveryBottom.name}
                className="w-10 h-12 rounded-lg object-cover"
              />
              <span className="text-xs font-semibold text-[#1C1917] max-w-[120px] truncate">
                {discoveryBottom.name}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
