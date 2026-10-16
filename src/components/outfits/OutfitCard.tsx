import React from 'react';
import { Heart, Calendar, Check, Sparkles, Layers } from 'lucide-react';
import { Outfit, ClothingItem } from '../../types/wardrobe';
import { OutfitSilhouetteView } from './OutfitSilhouetteView';

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
      className="group bg-[#FAF8F5] rounded-3xl border border-[#E7E0D8] overflow-hidden hover:border-[#D0C4B8] hover:shadow-lg transition-all cursor-pointer flex flex-col"
    >
      {/* Visual Composition: Layered Studio Outfit Silhouette */}
      <div className="relative p-2.5 bg-[#F4EFE6]/60">
        <OutfitSilhouetteView
          items={outfitItems}
          outfitName={outfit.name}
          interactive={false}
          className="shadow-sm"
        />

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => onToggleFavorite(outfit.id, e)}
          className={`absolute top-5 right-5 p-2 rounded-full backdrop-blur-md transition shadow-sm z-25 ${
            outfit.isFavorite
              ? 'bg-[#1C1917]/90 text-rose-400 hover:bg-[#1C1917]'
              : 'bg-white/90 text-[#786C60] hover:bg-white hover:text-rose-500'
          }`}
          title={outfit.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Heart
            className={`w-4 h-4 ${outfit.isFavorite ? 'fill-current text-rose-500' : ''}`}
          />
        </button>

        {/* Style Tag */}
        <div className="absolute top-5 left-5 z-25">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#1C1917]/85 text-[#FAF8F5] backdrop-blur-md shadow-xs">
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
            <span>•</span>
            <span className="font-semibold text-[#1C1917]">{outfitItems.length} Parça</span>
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
            <span className="font-semibold not-italic">Stil & Katman Dengesi: </span>
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
                type="button"
                onClick={(e) => onSave(outfit, e)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kaydet</span>
              </button>
            )}

            {onSchedule && (
              <button
                type="button"
                onClick={(e) => onSchedule(outfit, e)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#5C5248] hover:bg-[#EAE2D5] border border-[#DDD4C7] transition"
                title="Haftalık Plana Ekle"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Planla</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
