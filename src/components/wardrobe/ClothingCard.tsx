import React from 'react';
import { Heart, Sparkles, PlusCircle } from 'lucide-react';
import { ClothingItem, CATEGORY_LABELS } from '../../types/wardrobe';

interface ClothingCardProps {
  item: ClothingItem;
  onClick: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onQuickLogWear?: (id: string, e: React.MouseEvent) => void;
}

export const ClothingCard: React.FC<ClothingCardProps> = ({
  item,
  onClick,
  onToggleFavorite,
  onQuickLogWear,
}) => {
  return (
    <div
      onClick={onClick}
      className="group relative bg-[#FAF8F5] rounded-2xl border border-[#E7E0D8] overflow-hidden hover:shadow-md hover:border-[#D0C4B8] transition-all cursor-pointer flex flex-col"
    >
      {/* Visual Container */}
      <div className="relative aspect-4/5 w-full bg-[#F3EDE6] overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-500 ease-out"
        />

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => onToggleFavorite(item.id, e)}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition shadow-xs z-10 ${
            item.isFavorite
              ? 'bg-[#1C1917]/80 text-rose-400 hover:bg-[#1C1917]'
              : 'bg-white/80 text-[#786C60] hover:bg-white hover:text-rose-500'
          }`}
          title={item.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Heart
            className={`w-4 h-4 ${item.isFavorite ? 'fill-current text-rose-500' : ''}`}
          />
        </button>

        {/* Category Pill */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#1C1917]/75 backdrop-blur-md text-[#FAF8F5]">
            {CATEGORY_LABELS[item.category] || item.category}
          </span>
        </div>

        {/* Status / Demo Indicator */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          {item.isDemoItem && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#EFE9DF]/90 text-[#6B5E52] border border-[#DDD4C7] backdrop-blur-xs">
              Örnek Parça
            </span>
          )}
          {item.status === 'laundry' && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-100/90 text-amber-900 border border-amber-200">
              Çamaşırda
            </span>
          )}
        </div>

        {/* Quick Wear Button overlay on hover */}
        {onQuickLogWear && (
          <button
            onClick={(e) => onQuickLogWear(item.id, e)}
            className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-[#1C1917]/85 hover:bg-[#1C1917] text-[#FAF8F5] shadow-sm z-10"
            title="Bugün Giydim (+1)"
          >
            <PlusCircle className="w-4 h-4 text-[#E6DEC8]" />
          </button>
        )}
      </div>

      {/* Info Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between gap-1 text-[11px] text-[#8C7A6B]">
            <span className="truncate">{item.subcategory}</span>
            <span className="font-medium shrink-0">{item.season}</span>
          </div>
          <h3 className="font-serif-editorial text-base font-bold text-[#1C1917] leading-tight line-clamp-1 mt-0.5 group-hover:text-[#4A5320] transition-colors">
            {item.name}
          </h3>
        </div>

        <div className="pt-2 border-t border-[#EFE9DF] flex items-center justify-between text-xs text-[#5C5248]">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
              style={{
                backgroundColor:
                  item.primaryColor.toLowerCase().includes('siyah')
                    ? '#1C1917'
                    : item.primaryColor.toLowerCase().includes('beyaz')
                    ? '#FFFFFF'
                    : item.primaryColor.toLowerCase().includes('bej') ||
                      item.primaryColor.toLowerCase().includes('ekru')
                    ? '#EADBC8'
                    : item.primaryColor.toLowerCase().includes('mavi')
                    ? '#4682B4'
                    : item.primaryColor.toLowerCase().includes('gri')
                    ? '#808080'
                    : item.primaryColor.toLowerCase().includes('haki') ||
                      item.primaryColor.toLowerCase().includes('yeşil')
                    ? '#556B2F'
                    : item.primaryColor.toLowerCase().includes('kahve')
                    ? '#8B4513'
                    : '#C5B4A5',
              }}
            />
            <span className="text-[11px] font-medium truncate max-w-[80px]">
              {item.primaryColor}
            </span>
          </div>

          <span className="text-[11px] font-semibold text-[#8C7A6B]">
            {item.wearCount || 0} kez giyildi
          </span>
        </div>
      </div>
    </div>
  );
};
