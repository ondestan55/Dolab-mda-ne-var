import React from 'react';
import { Heart, Calendar, PlusCircle, Sparkles, ChevronRight, Check } from 'lucide-react';
import { Outfit, ClothingItem } from '../../types/wardrobe';

interface OutfitCardProps {
  outfit: Outfit;
  itemsMap: Map<string, ClothingItem>;
  onSelect: (outfit: Outfit) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSchedule?: (outfit: Outfit, e: React.MouseEvent) => void;
  onLogWear?: (outfitId: string, itemIds: string[], e: React.MouseEvent) => void;
  isSaved?: boolean;
  onSave?: (outfit: Outfit, e: React.MouseEvent) => void;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  itemsMap,
  onSelect,
  onToggleFavorite,
  onSchedule,
  onLogWear,
  isSaved = true,
  onSave,
}) => {
  // Resolve actual items from wardrobe
  const outfitItems = outfit.itemIds
    .map((id) => itemsMap.get(id))
    .filter((item): item is ClothingItem => item !== undefined);

  return (
    <div
      onClick={() => onSelect(outfit)}
      className="group bg-[#FAF8F5] rounded-3xl border border-[#E7E0D8] overflow-hidden hover:border-[#D0C4B8] hover:shadow-md transition-all cursor-pointer flex flex-col"
    >
      {/* Visual Collage of Real Garment Photos */}
      <div className="relative aspect-4/3 w-full bg-[#F3EDE6] overflow-hidden p-2.5">
        <div
          className={`grid gap-2 w-full h-full rounded-2xl overflow-hidden ${
            outfitItems.length === 1
              ? 'grid-cols-1'
              : outfitItems.length === 2
              ? 'grid-cols-2'
              : outfitItems.length === 3
              ? 'grid-cols-3'
              : 'grid-cols-2 grid-rows-2'
          }`}
        >
          {outfitItems.slice(0, 4).map((item, idx) => (
            <div
              key={item.id + '_' + idx}
              className="relative w-full h-full bg-white overflow-hidden rounded-xl border border-[#E7E0D8]/80 group-hover:scale-102 transition-transform duration-300"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover object-center"
              />
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[8px] font-semibold bg-black/60 backdrop-blur-xs text-white max-w-[90%] truncate">
                {item.subcategory}
              </span>
            </div>
          ))}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => onToggleFavorite(outfit.id, e)}
          className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition shadow-xs z-10 ${
            outfit.isFavorite
              ? 'bg-[#1C1917]/85 text-rose-400 hover:bg-[#1C1917]'
              : 'bg-white/85 text-[#786C60] hover:bg-white hover:text-rose-500'
          }`}
          title={outfit.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Heart
            className={`w-4 h-4 ${outfit.isFavorite ? 'fill-current text-rose-500' : ''}`}
          />
        </button>

        {/* Style Tag */}
        <div className="absolute top-4 left-4">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#1C1917]/80 text-[#FAF8F5] backdrop-blur-md">
            {outfit.style}
          </span>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C7A6B]">
            <span>{outfit.occasion}</span>
            <span>•</span>
            <span>{outfit.season}</span>
          </div>

          <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917] mt-1 leading-snug group-hover:text-[#4A5320] transition-colors">
            {outfit.name}
          </h3>

          <p className="text-xs text-[#6B5E52] mt-1.5 line-clamp-2 leading-relaxed">
            {outfit.description}
          </p>
        </div>

        {/* Color harmony or reason highlight */}
        {outfit.colorHarmonyReasoning && (
          <div className="p-2.5 rounded-xl bg-[#F4EFE6] border border-[#E7E0D8] text-[11px] text-[#5C5248] line-clamp-2 italic">
            <span className="font-semibold not-italic">Renk & Stil Uyumu: </span>
            {outfit.colorHarmonyReasoning}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-[#EFE9DF] flex items-center justify-between text-xs">
          <span className="text-[#8C7A6B] font-medium text-[11px]">
            {outfit.wearCount > 0
              ? `${outfit.wearCount} kez giyildi`
              : 'Henüz giyilmedi'}
          </span>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {!isSaved && onSave && (
              <button
                onClick={(e) => onSave(outfit, e)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            )}

            {onSchedule && (
              <button
                onClick={(e) => onSchedule(outfit, e)}
                className="p-1.5 rounded-lg text-[#5C5248] hover:bg-[#EAE2D5] hover:text-[#1C1917] transition"
                title="Takvime Planla"
              >
                <Calendar className="w-4 h-4" />
              </button>
            )}

            {onLogWear && (
              <button
                onClick={(e) => onLogWear(outfit.id, outfit.itemIds, e)}
                className="p-1.5 rounded-lg text-[#5C5248] hover:bg-[#EAE2D5] hover:text-[#1C1917] transition"
                title="Bugün Giydim (+1)"
              >
                <PlusCircle className="w-4 h-4 text-[#4A5320]" />
              </button>
            )}

            <button
              onClick={() => onSelect(outfit)}
              className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#1C1917] hover:bg-[#EAE2D5] transition"
              title="Detayları İncele"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
