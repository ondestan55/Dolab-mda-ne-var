import React, { useState, useMemo } from 'react';
import { Search, Heart, Sparkles, Filter, BookmarkCheck, Plus, X } from 'lucide-react';
import { Outfit, ClothingItem, STYLES } from '../../types/wardrobe';
import { OutfitCard } from './OutfitCard';

interface OutfitsListProps {
  outfits: Outfit[];
  itemsMap: Map<string, ClothingItem>;
  onSelectOutfit: (outfit: Outfit) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onScheduleOutfit: (outfit: Outfit) => void;
  onLogWear: (outfitId: string, itemIds: string[], e: React.MouseEvent) => void;
  onNavigateToGenerate: () => void;
}

export const OutfitsList: React.FC<OutfitsListProps> = ({
  outfits,
  itemsMap,
  onSelectOutfit,
  onToggleFavorite,
  onScheduleOutfit,
  onLogWear,
  onNavigateToGenerate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const filteredOutfits = useMemo(() => {
    return outfits.filter((outfit) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          outfit.name.toLowerCase().includes(q) ||
          outfit.description.toLowerCase().includes(q) ||
          outfit.occasion.toLowerCase().includes(q) ||
          outfit.style.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedStyle !== 'all' && outfit.style !== selectedStyle) {
        return false;
      }

      if (onlyFavorites && !outfit.isFavorite) {
        return false;
      }

      return true;
    });
  }, [outfits, searchQuery, selectedStyle, onlyFavorites]);

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
            Stil Koleksiyonum
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight">
            Kombinlerim
          </h2>
          <p className="text-xs sm:text-sm text-[#786C60] mt-1">
            Toplam <span className="font-semibold text-[#1C1917]">{outfits.length}</span> kayıtlı kombin
            {filteredOutfits.length !== outfits.length && (
              <span> (filtrelenen: {filteredOutfits.length})</span>
            )}
          </p>
        </div>

        <button
          onClick={onNavigateToGenerate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1C1917] hover:bg-[#38332E] text-[#FAF8F5] transition shadow-xs self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-[#E6DEC8]" />
          <span>Yeni Kombin Oluştur</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FAF8F5] p-4 rounded-3xl border border-[#E7E0D8] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kombin adı, ortam veya stil ara..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#1C1917]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
                onlyFavorites
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-white text-[#5C5248] border-[#D5C9BE] hover:bg-[#F3EDE6]'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current text-rose-600' : ''}`}
              />
              <span>Favoriler</span>
            </button>

            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs font-semibold text-[#5C5248] focus:outline-hidden"
            >
              <option value="all">Tüm Stiller</option>
              {STYLES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Outfits */}
      {filteredOutfits.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#FAF8F5] border border-dashed border-[#D5C9BE] space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EAE2D5] text-[#5C5248] flex items-center justify-center mx-auto">
            <BookmarkCheck className="w-8 h-8 text-[#8C7A6B]" />
          </div>
          <div>
            <h3 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
              {outfits.length === 0
                ? 'Henüz Kayıtlı Kombininiz Yok'
                : 'Filtreye Uygun Kombin Bulunamadı'}
            </h3>
            <p className="text-xs sm:text-sm text-[#786C60] max-w-md mx-auto mt-1">
              {outfits.length === 0
                ? 'AI Kombin Oluşturucu ile dolabınızdaki parçalardan zahmetsiz ve şık kombinler yaratıp buraya kaydedebilirsiniz.'
                : 'Filtreleri temizleyerek tekrar arama yapabilirsiniz.'}
            </p>
          </div>
          {outfits.length === 0 ? (
            <button
              onClick={onNavigateToGenerate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[#E6DEC8]" />
              Kombin Oluştur
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStyle('all');
                setOnlyFavorites(false);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FAF8F5] text-[#1C1917] border border-[#D5C9BE] hover:bg-[#F3EDE6]"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOutfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              itemsMap={itemsMap}
              onSelect={onSelectOutfit}
              onToggleFavorite={onToggleFavorite}
              onSchedule={(o, e) => {
                e.stopPropagation();
                onScheduleOutfit(o);
              }}
              onLogWear={onLogWear}
            />
          ))}
        </div>
      )}
    </div>
  );
};
