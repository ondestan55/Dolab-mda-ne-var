import React, { useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  DollarSign,
  TrendingUp,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Award,
  Clock,
  Layers,
} from 'lucide-react';
import {
  ClothingItem,
  Outfit,
  CATEGORY_LABELS,
  CategoryType,
} from '../../types/wardrobe';

interface StyleAnalyticsProps {
  items: ClothingItem[];
  outfits: Outfit[];
  onSelectItem: (item: ClothingItem) => void;
  onNavigateToWardrobe: () => void;
}

export const StyleAnalytics: React.FC<StyleAnalyticsProps> = ({
  items,
  outfits,
  onSelectItem,
  onNavigateToWardrobe,
}) => {
  // 1. Wardrobe Utilization Rate: % of items worn at least once
  const stats = useMemo(() => {
    const totalItems = items.length;
    if (totalItems === 0) return null;

    const wornItems = items.filter((i) => (i.wearCount || 0) > 0);
    const utilizationRate = Math.round((wornItems.length / totalItems) * 100);

    // Most worn (Top 4)
    const mostWorn = [...items]
      .filter((i) => (i.wearCount || 0) > 0)
      .sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0))
      .slice(0, 4);

    // Least worn / unworn
    const unworn = [...items]
      .filter((i) => (i.wearCount || 0) === 0)
      .slice(0, 4);

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    for (const item of items) {
      const catLabel = CATEGORY_LABELS[item.category] || item.category;
      categoryCounts[catLabel] = (categoryCounts[catLabel] || 0) + 1;
    }

    // Color distribution
    const colorCounts: Record<string, number> = {};
    for (const item of items) {
      const c = item.primaryColor.trim();
      if (c) {
        colorCounts[c] = (colorCounts[c] || 0) + 1;
      }
    }

    // Season distribution
    const seasonCounts: Record<string, number> = {};
    for (const item of items) {
      seasonCounts[item.season] = (seasonCounts[item.season] || 0) + 1;
    }

    // Versatility Index: items that have been matched in outfits
    const duplicateClusters: { key: string; count: number; sampleItems: ClothingItem[] }[] = [];
    const groupKeyMap: Record<string, ClothingItem[]> = {};

    for (const item of items) {
      const key = `${item.subcategory.toLowerCase()}_${item.primaryColor.toLowerCase()}`;
      if (!groupKeyMap[key]) groupKeyMap[key] = [];
      groupKeyMap[key].push(item);
    }

    for (const [key, group] of Object.entries(groupKeyMap)) {
      if (group.length >= 2) {
        duplicateClusters.push({
          key,
          count: group.length,
          sampleItems: group,
        });
      }
    }

    return {
      totalItems,
      utilizationRate,
      mostWorn,
      unworn,
      categoryCounts,
      colorCounts,
      seasonCounts,
      duplicateClusters,
    };
  }, [items]);

  if (!stats) {
    return (
      <div className="p-12 text-center rounded-3xl bg-[#FAF8F5] border border-dashed border-[#D5C9BE] space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#EAE2D5] text-[#8C7A6B] flex items-center justify-center mx-auto">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
            Analiz İçin Dolap Verisi Bekleniyor
          </h3>
          <p className="text-xs sm:text-sm text-[#786C60] max-w-md mx-auto mt-1">
            Stil analizi ve kullanım başına maliyet istatistiklerinin hesaplanabilmesi için dolabınıza kıyafetler ekleyin.
          </p>
        </div>
        <button
          onClick={onNavigateToWardrobe}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C1917] text-[#FAF8F5]"
        >
          Dolaba Git
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
          Gardırop İntelijansı
        </span>
        <h2 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight">
          Stil ve Dolap Analizi
        </h2>
        <p className="text-xs sm:text-sm text-[#786C60] mt-1">
          Gerçek gardırop kayıtlarınızdan ve giyim geçmişinizden hesaplanan akıllı moda içgörüleri.
        </p>
      </div>

      {/* Top Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Utilization Rate */}
        <div className="p-5 rounded-3xl bg-[#FAF8F5] border border-[#E7E0D8] space-y-2">
          <span className="text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Dolap Verimlilik Skoru
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif-editorial text-4xl font-bold text-[#1C1917]">
              %{stats.utilizationRate}
            </span>
            <span className="text-xs text-[#4A5320] font-medium">
              kullanım oranı
            </span>
          </div>
          <div className="w-full bg-[#EAE2D5] rounded-full h-2 overflow-hidden mt-1">
            <div
              className="bg-[#1C1917] h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.utilizationRate}%` }}
            />
          </div>
          <p className="text-[11px] text-[#786C60]">
            Kıyafetlerinizin %{stats.utilizationRate}’i en az 1 kez giyildi.
          </p>
        </div>

        {/* Total Pieces */}
        <div className="p-5 rounded-3xl bg-[#FAF8F5] border border-[#E7E0D8] space-y-2">
          <span className="text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Aktif Kıyafet
          </span>
          <span className="font-serif-editorial text-4xl font-bold text-[#1C1917] block">
            {stats.totalItems}
          </span>
          <p className="text-[11px] text-[#786C60]">
            Toplam {outfits.length} farklı kombin oluşturuldu.
          </p>
        </div>

        {/* Cost Per Wear */}
        <div className="p-5 rounded-3xl bg-[#FAF8F5] border border-[#E7E0D8] space-y-2">
          <span className="text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Ort. Giyim Başı Maliyet
          </span>
          {stats.avgCostPerWear !== null ? (
            <>
              <span className="font-serif-editorial text-4xl font-bold text-[#2E5A36] block">
                {stats.avgCostPerWear.toLocaleString('tr-TR')} TL
              </span>
              <p className="text-[11px] text-[#786C60]">
                {stats.itemsWithPriceCount} fiyatlı parça üzerinden hesaplandı.
              </p>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold text-[#8C7A6B] block pt-2">
                Fiyat bilgisi girilmedi
              </span>
              <p className="text-[11px] text-[#786C60]">
                Kıyafetlerinize satın alma fiyatı ekleyerek maliyet analizi görebilirsiniz.
              </p>
            </>
          )}
        </div>

        {/* Duplicates Alert */}
        <div className="p-5 rounded-3xl bg-[#FAF8F5] border border-[#E7E0D8] space-y-2">
          <span className="text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Yinelenen / Benzer Parça
          </span>
          <span className="font-serif-editorial text-4xl font-bold text-[#1C1917] block">
            {stats.duplicateClusters.length}
          </span>
          <p className="text-[11px] text-[#786C60]">
            Dolabınızda benzer renkte yinelenen modeller.
          </p>
        </div>
      </div>

      {/* Category Breakdown & Colors Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E7E0D8] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
            <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
              Kategori Dağılımı
            </h3>
            <span className="text-xs text-[#8C7A6B]">Kıyafet dengesi</span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.categoryCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const percent = Math.round((count / stats.totalItems) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#292524]">{cat}</span>
                      <span className="font-semibold text-[#6B5E52]">
                        {count} adet (%{percent})
                      </span>
                    </div>
                    <div className="w-full bg-[#EAE2D5] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#1C1917] h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Color Palette Map */}
        <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E7E0D8] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
            <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
              Gardırop Renk Haritası
            </h3>
            <span className="text-xs text-[#8C7A6B]">Baskın tonlar</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(stats.colorCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([color, count]) => {
                const percent = Math.round((count / stats.totalItems) * 100);
                return (
                  <div
                    key={color}
                    className="p-3 rounded-2xl bg-[#F7F4EE] border border-[#E7E0D8] flex items-center gap-3"
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                      style={{
                        backgroundColor:
                          color.toLowerCase().includes('siyah')
                            ? '#1C1917'
                            : color.toLowerCase().includes('beyaz')
                            ? '#FFFFFF'
                            : color.toLowerCase().includes('krem') ||
                              color.toLowerCase().includes('ekru')
                            ? '#EFE4D2'
                            : color.toLowerCase().includes('bej')
                            ? '#D2B48C'
                            : color.toLowerCase().includes('mavi')
                            ? '#4682B4'
                            : color.toLowerCase().includes('gri')
                            ? '#808080'
                            : color.toLowerCase().includes('haki') ||
                              color.toLowerCase().includes('yeşil')
                            ? '#556B2F'
                            : color.toLowerCase().includes('kahve')
                            ? '#8B4513'
                            : color.toLowerCase().includes('lacivert')
                            ? '#000080'
                            : '#B39D82',
                      }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#1C1917] block truncate">
                        {color}
                      </span>
                      <span className="text-[10px] text-[#8C7A6B]">
                        {count} parça (%{percent})
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Most Worn vs Unworn Pieces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Worn "Yıldız Parçalar" */}
        <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E7E0D8] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
                En Çok Tercih Edilenler (Yıldız Parçalar)
              </h3>
            </div>
            <span className="text-xs text-[#8C7A6B]">Giyim rekorları</span>
          </div>

          {stats.mostWorn.length === 0 ? (
            <p className="text-xs text-[#8C7A6B] italic py-4">
              Henüz kullanım kaydı girilmiş kıyafet bulunmuyor.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.mostWorn.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="p-3 rounded-2xl bg-white border border-[#E7E0D8] hover:border-[#1C1917] cursor-pointer transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#EAE2D5] text-[#1C1917] text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-14 rounded-xl object-cover bg-stone-100"
                    />
                    <div>
                      <h4 className="font-serif-editorial text-sm font-bold text-[#1C1917] group-hover:text-[#4A5320]">
                        {item.name}
                      </h4>
                      <span className="text-xs text-[#8C7A6B]">
                        {CATEGORY_LABELS[item.category]} • {item.primaryColor}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EBF3ED] text-[#2D5A38]">
                    {item.wearCount} giyim
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unworn "Unutulmuş Parçalar" */}
        <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E7E0D8] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8C7A6B]" />
              <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
                Dolapta Bekleyenler (Az Giyilenler)
              </h3>
            </div>
            <span className="text-xs text-[#8C7A6B]">Yeniden değerlendir</span>
          </div>

          {stats.unworn.length === 0 ? (
            <p className="text-xs text-emerald-800 font-medium py-4">
              Tebrikler! Dolabınızdaki tüm kıyafetleri en az bir kez kullandınız.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.unworn.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="p-3 rounded-2xl bg-white border border-[#E7E0D8] hover:border-[#1C1917] cursor-pointer transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-14 rounded-xl object-cover bg-stone-100 opacity-80 group-hover:opacity-100"
                    />
                    <div>
                      <h4 className="font-serif-editorial text-sm font-bold text-[#1C1917] group-hover:text-[#4A5320]">
                        {item.name}
                      </h4>
                      <span className="text-xs text-[#8C7A6B]">
                        {CATEGORY_LABELS[item.category]} • {item.season}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    Henüz giyilmedi
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sustainability & Smart Wardrobe Tips */}
      <div className="p-6 rounded-3xl bg-[#F0EBE1] border border-[#DDD4C7] space-y-3">
        <div className="flex items-center gap-2 text-[#4A5320]">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
            Akıllı Gardırop & Sürdürülebilirlik İpuçları
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-[#5C5248] leading-relaxed">
          Amacımız sizi daha fazla alışveriş yapmaya değil, <strong>zaten sahip olduğunuz kıyafetleri yaratıcı kombinlerle maksimum verimlilikte kullanmaya</strong> teşvik etmektir. Dolabınızdaki unutulmuş parçaları yeni bir ceket veya fularla eşleştirerek haftalık kombinlerinizde canlandırabilirsiniz.
        </p>
      </div>
    </div>
  );
};
