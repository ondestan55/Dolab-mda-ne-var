import React, { useState } from 'react';
import { ClothingItem, CATEGORY_LABELS } from '../../types/wardrobe';
import { Sparkles, Layers, Grid, Info } from 'lucide-react';

interface OutfitSilhouetteViewProps {
  items: ClothingItem[];
  outfitName?: string;
  interactive?: boolean;
  onItemClick?: (item: ClothingItem) => void;
  className?: string;
}

export const OutfitSilhouetteView: React.FC<OutfitSilhouetteViewProps> = ({
  items,
  outfitName,
  interactive = true,
  onItemClick,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'mannequin' | 'grid'>('mannequin');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Group garments by anatomical position
  const dresses = items.filter((i) => i.category === 'dress');
  const tops = items.filter((i) => i.category === 'top');
  const outerwear = items.filter((i) => i.category === 'outerwear');
  const bottoms = items.filter((i) => i.category === 'bottom');
  const shoes = items.filter((i) => i.category === 'shoes');
  const bags = items.filter((i) => i.category === 'bag');
  const accessories = items.filter((i) => i.category === 'accessory');

  // Distinguish inner vs mid tops
  const isInner = (t: ClothingItem) => {
    const s = (t.subcategory || '').toLowerCase();
    return s.includes('tişört') || s.includes('t-shirt') || s.includes('gömlek') || s.includes('atlet') || s.includes('bluz');
  };
  const innerTop = tops.find(isInner) || (tops.length > 1 ? tops[1] : null);
  const mainTop = tops.find((t) => t.id !== innerTop?.id) || tops[0];

  const mainBottom = bottoms[0];
  const mainShoes = shoes[0];
  const mainOuterwear = outerwear[0];
  const mainBag = bags[0];
  const topAccessory = accessories[0];
  const secondAccessory = accessories[1];

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-radial from-[#FDFCFA] via-[#F6F1EA] to-[#EBE3D7] border border-[#E7E0D8] shadow-inner ${className}`}>
      {/* Mode Switch Header */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-[#E0D7CC] text-[10px] font-semibold text-[#5C5248] shadow-xs">
          <Sparkles className="w-3 h-3 text-[#8C7A6B]" />
          <span>{items.length} Parçalı Giydirilmiş Stil</span>
        </div>

        <div className="pointer-events-auto flex items-center bg-white/90 backdrop-blur-md rounded-xl p-0.5 border border-[#E0D7CC] shadow-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('mannequin');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 ${
              viewMode === 'mannequin'
                ? 'bg-[#1C1917] text-[#FAF8F5]'
                : 'text-[#786C60] hover:text-[#1C1917]'
            }`}
            title="Kıyafetleri bir arada giydirilmiş gibi göster"
          >
            <Layers className="w-3 h-3" />
            <span>Manken</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('grid');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 ${
              viewMode === 'grid'
                ? 'bg-[#1C1917] text-[#FAF8F5]'
                : 'text-[#786C60] hover:text-[#1C1917]'
            }`}
            title="Parça listesi görünümü"
          >
            <Grid className="w-3 h-3" />
            <span>Parçalar</span>
          </button>
        </div>
      </div>

      {viewMode === 'mannequin' ? (
        /* MANNEQUIN / LAYERED FLAT-LAY COMPOSITION */
        <div className="relative min-h-[380px] sm:min-h-[440px] w-full flex flex-col items-center justify-between p-6 sm:p-8 pt-12 pb-6">
          {/* Subtle Mannequin Torso Guide Lines (Very faint watermark) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <svg viewBox="0 0 100 200" className="h-full w-auto stroke-stone-600 fill-none" strokeWidth="0.5">
              <path d="M50 15 C45 25, 30 35, 25 55 C20 75, 35 110, 38 130 L38 185 M50 15 C55 25, 70 35, 75 55 C80 75, 65 110, 62 130 L62 185" />
            </svg>
          </div>

          {/* Top Accessory (Hat / Scarf / Glasses) */}
          {topAccessory && (
            <div
              onClick={() => onItemClick && onItemClick(topAccessory)}
              onMouseEnter={() => setHoveredItemId(topAccessory.id)}
              onMouseLeave={() => setHoveredItemId(null)}
              className="relative z-15 -mb-4 transition-transform hover:scale-105 cursor-pointer"
              title={`${topAccessory.name} (${CATEGORY_LABELS[topAccessory.category]})`}
            >
              <img
                src={topAccessory.imageUrl}
                alt={topAccessory.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
              />
            </div>
          )}

          {/* TORSO SECTION: Dress OR (Outerwear + Layered Tops) */}
          <div className="relative z-10 w-full flex items-center justify-center max-w-[280px] sm:max-w-[320px]">
            {dresses.length > 0 ? (
              /* Dress Flow */
              <div
                onClick={() => onItemClick && onItemClick(dresses[0])}
                onMouseEnter={() => setHoveredItemId(dresses[0].id)}
                onMouseLeave={() => setHoveredItemId(null)}
                className="relative z-10 transition-transform hover:scale-102 cursor-pointer flex flex-col items-center"
              >
                <img
                  src={dresses[0].imageUrl}
                  alt={dresses[0].name}
                  className="w-48 sm:w-56 max-h-60 sm:max-h-72 object-contain drop-shadow-xl"
                />
              </div>
            ) : (
              /* Layered Upper Body: Outerwear framing Tops */
              <div className="relative flex items-center justify-center w-full">
                {/* Outerwear (Jackets / Coats Layered around) */}
                {mainOuterwear && (
                  <div
                    onClick={() => onItemClick && onItemClick(mainOuterwear)}
                    onMouseEnter={() => setHoveredItemId(mainOuterwear.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className="absolute z-20 -left-2 sm:left-0 transition-transform hover:scale-105 cursor-pointer -rotate-4"
                    title={`${mainOuterwear.name} (${CATEGORY_LABELS[mainOuterwear.category]})`}
                  >
                    <img
                      src={mainOuterwear.imageUrl}
                      alt={mainOuterwear.name}
                      className="w-32 sm:w-40 max-h-48 sm:max-h-56 object-contain drop-shadow-xl"
                    />
                  </div>
                )}

                {/* Primary Top (Sweater / Knitwear / Shirt) */}
                {mainTop && (
                  <div
                    onClick={() => onItemClick && onItemClick(mainTop)}
                    onMouseEnter={() => setHoveredItemId(mainTop.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className="relative z-10 transition-transform hover:scale-102 cursor-pointer"
                    title={`${mainTop.name} (${CATEGORY_LABELS[mainTop.category]})`}
                  >
                    <img
                      src={mainTop.imageUrl}
                      alt={mainTop.name}
                      className="w-40 sm:w-48 max-h-48 sm:max-h-52 object-contain drop-shadow-lg"
                    />
                  </div>
                )}

                {/* Layered Inner Top (T-shirt showing slightly under/above collar) */}
                {innerTop && innerTop.id !== mainTop?.id && (
                  <div
                    onClick={() => onItemClick && onItemClick(innerTop)}
                    onMouseEnter={() => setHoveredItemId(innerTop.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className="absolute z-5 -top-2 right-2 sm:right-4 transition-transform hover:scale-105 cursor-pointer rotate-6 opacity-90"
                    title={`${innerTop.name} (İç Katman)`}
                  >
                    <img
                      src={innerTop.imageUrl}
                      alt={innerTop.name}
                      className="w-24 sm:w-28 max-h-32 object-contain drop-shadow-md"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Side Bag (Positioned naturally at hip level) */}
            {mainBag && (
              <div
                onClick={() => onItemClick && onItemClick(mainBag)}
                onMouseEnter={() => setHoveredItemId(mainBag.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                className="absolute -right-4 sm:-right-8 top-12 z-25 transition-transform hover:scale-110 cursor-pointer rotate-8"
                title={`${mainBag.name} (${CATEGORY_LABELS[mainBag.category]})`}
              >
                <img
                  src={mainBag.imageUrl}
                  alt={mainBag.name}
                  className="w-20 sm:w-24 max-h-28 object-contain drop-shadow-xl"
                />
              </div>
            )}
          </div>

          {/* LOWER BODY: Strictly ONE Bottom Piece directly beneath the torso */}
          {mainBottom && !dresses.length && (
            <div
              onClick={() => onItemClick && onItemClick(mainBottom)}
              onMouseEnter={() => setHoveredItemId(mainBottom.id)}
              onMouseLeave={() => setHoveredItemId(null)}
              className="relative z-8 -mt-6 sm:-mt-8 transition-transform hover:scale-102 cursor-pointer flex flex-col items-center"
              title={`${mainBottom.name} (${CATEGORY_LABELS[mainBottom.category]})`}
            >
              <img
                src={mainBottom.imageUrl}
                alt={mainBottom.name}
                className="w-44 sm:w-52 max-h-56 sm:max-h-64 object-contain drop-shadow-lg"
              />
            </div>
          )}

          {/* FEET: Shoes aligned at the base */}
          {mainShoes && (
            <div
              onClick={() => onItemClick && onItemClick(mainShoes)}
              onMouseEnter={() => setHoveredItemId(mainShoes.id)}
              onMouseLeave={() => setHoveredItemId(null)}
              className="relative z-12 -mt-4 transition-transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
              title={`${mainShoes.name} (${CATEGORY_LABELS[mainShoes.category]})`}
            >
              <img
                src={mainShoes.imageUrl}
                alt={mainShoes.name}
                className="w-32 sm:w-36 max-h-24 sm:max-h-28 object-contain drop-shadow-xl"
              />
            </div>
          )}

          {/* Bottom Floating Tag / Active Hover Detail */}
          {hoveredItemId && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-[#1C1917]/90 backdrop-blur-md text-[#FAF8F5] text-[11px] font-medium shadow-lg animate-in fade-in duration-150 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{items.find((i) => i.id === hoveredItemId)?.name}</span>
            </div>
          )}
        </div>
      ) : (
        /* GRID / LIST VIEW (All pieces individually selectable) */
        <div className="p-4 sm:p-6 pt-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item, idx) => (
              <div
                key={item.id + '_' + idx}
                onClick={() => onItemClick && onItemClick(item)}
                className="group/item bg-white/85 rounded-2xl border border-[#E7E0D8] p-2.5 flex flex-col justify-between hover:bg-white hover:border-[#1C1917] transition shadow-xs cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-[#FAF8F5] mb-2 flex items-center justify-center p-1">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-contain group-hover/item:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#8C7A6B] uppercase block">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </span>
                  <h5 className="font-serif-editorial text-xs font-bold text-[#1C1917] line-clamp-1">
                    {item.name}
                  </h5>
                  <span className="text-[10px] text-[#786C60] block mt-0.5">
                    {item.primaryColor} • {item.style}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
