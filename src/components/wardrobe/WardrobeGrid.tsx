import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  Plus,
  Heart,
  Sparkles,
  Shirt,
  X,
} from 'lucide-react';
import {
  ClothingItem,
  CategoryType,
  CATEGORY_LABELS,
  SEASONS,
  STYLES,
  SeasonType,
  StyleType,
} from '../../types/wardrobe';
import { ClothingCard } from './ClothingCard';

interface WardrobeGridProps {
  items: ClothingItem[];
  onSelectItem: (item: ClothingItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onOpenAddModal: () => void;
  onQuickLogWear: (id: string, e: React.MouseEvent) => void;
}

export const WardrobeGrid: React.FC<WardrobeGridProps> = ({
  items,
  onSelectItem,
  onToggleFavorite,
  onOpenAddModal,
  onQuickLogWear,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedSeason, setSelectedSeason] = useState<SeasonType | 'all'>('all');
  const [selectedStyle, setSelectedStyle] = useState<StyleType | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'laundry'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'most_worn' | 'least_worn' | 'name' | 'price'>(
    'newest'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            item.name.toLowerCase().includes(q) ||
            item.subcategory.toLowerCase().includes(q) ||
            (item.brand && item.brand.toLowerCase().includes(q)) ||
            item.primaryColor.toLowerCase().includes(q) ||
            item.style.toLowerCase().includes(q) ||
            (item.notes && item.notes.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Category
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // Season
        if (
          selectedSeason !== 'all' &&
          item.season !== selectedSeason &&
          item.season !== 'Dört Mevsim'
        ) {
          return false;
        }

        // Style
        if (selectedStyle !== 'all' && item.style !== selectedStyle) {
          return false;
        }

        // Favorites
        if (onlyFavorites && !item.isFavorite) {
          return false;
        }

        // Status
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        if (sortBy === 'most_worn') return (b.wearCount || 0) - (a.wearCount || 0);
        if (sortBy === 'least_worn') return (a.wearCount || 0) - (b.wearCount || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'tr');
        if (sortBy === 'price') return (b.purchasePrice || 0) - (a.purchasePrice || 0);
        return 0;
      });
  }, [
    items,
    searchQuery,
    selectedCategory,
    selectedSeason,
    selectedStyle,
    onlyFavorites,
    statusFilter,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'all' ||
    selectedSeason !== 'all' ||
    selectedStyle !== 'all' ||
    onlyFavorites ||
    statusFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSeason('all');
    setSelectedStyle('all');
    setOnlyFavorites(false);
    setStatusFilter('all');
  };

  const categoriesList: { id: CategoryType | 'all'; label: string }[] = [
    { id: 'all', label: 'Tüm Dolap' },
    { id: 'top', label: 'Üst Giyim' },
    { id: 'bottom', label: 'Alt Giyim' },
    { id: 'outerwear', label: 'Dış Giyim' },
    { id: 'dress', label: 'Elbise & Tulum' },
    { id: 'shoes', label: 'Ayakkabı' },
    { id: 'bag', label: 'Çanta' },
    { id: 'accessory', label: 'Aksesuar' },
    { id: 'activewear', label: 'Spor Giyim' },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
            Kişisel Gardırop
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight">
            Dijital Dolabım
          </h2>
          <p className="text-xs sm:text-sm text-[#786C60] mt-1">
            Toplam <span className="font-semibold text-[#1C1917]">{items.length}</span> parça kıyafet kayıtlı
            {filteredItems.length !== items.length && (
              <span> (filtrelenen: {filteredItems.length})</span>
            )}
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1C1917] hover:bg-[#38332E] text-[#FAF8F5] transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kıyafet Ekle</span>
        </button>
      </div>

      {/* Search & Main Filter Controls */}
      <div className="space-y-3 bg-[#FAF8F5] p-4 rounded-3xl border border-[#E7E0D8]">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İsim, alt kategori, marka, renk veya kumaş ara..."
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

          {/* Quick Filters: Favorites toggle, Sort, View mode */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Favorites toggle */}
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

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs font-semibold text-[#5C5248] focus:outline-hidden shrink-0"
            >
              <option value="newest">En Yeni Eklenenler</option>
              <option value="most_worn">En Çok Giyilenler</option>
              <option value="least_worn">En Az Giyilenler</option>
              <option value="name">İsim (A-Z)</option>
              <option value="price">Fiyat (Yüksek-Düşük)</option>
            </select>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-xl border transition shrink-0 ${
                showAdvancedFilters || (selectedSeason !== 'all' || selectedStyle !== 'all')
                  ? 'bg-[#1C1917] text-[#FAF8F5] border-[#1C1917]'
                  : 'bg-white text-[#5C5248] border-[#D5C9BE] hover:bg-[#F3EDE6]'
              }`}
              title="Gelişmiş Filtreler"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* View Mode Grid/List */}
            <div className="hidden sm:flex items-center bg-white border border-[#D5C9BE] rounded-xl p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-[#1C1917] text-[#FAF8F5]'
                    : 'text-[#8C7A6B] hover:text-[#1C1917]'
                }`}
                title="Izgara Görünümü"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-[#1C1917] text-[#FAF8F5]'
                    : 'text-[#8C7A6B] hover:text-[#1C1917]'
                }`}
                title="Liste Görünümü"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === 'all'
                ? items.length
                : items.filter((i) => i.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[#1C1917] text-[#FAF8F5] shadow-xs'
                    : 'bg-white text-[#5C5248] border border-[#E7E0D8] hover:bg-[#F0EBE1]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-[#FAF8F5]' : 'bg-[#EAE2D5] text-[#786C60]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Expandable Advanced Filters (Season, Style, Laundry) */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-[#E7E0D8] grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B5E52] uppercase mb-1">
                Mevsim
              </label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs text-[#1C1917]"
              >
                <option value="all">Tüm Mevsimler</option>
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6B5E52] uppercase mb-1">
                Stil
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs text-[#1C1917]"
              >
                <option value="all">Tüm Stiller</option>
                {STYLES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6B5E52] uppercase mb-1">
                Durum
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs text-[#1C1917]"
              >
                <option value="all">Tümü</option>
                <option value="active">Dolapta (Aktif)</option>
                <option value="laundry">Çamaşırda / Bakımda</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Clear Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-[#8C7A6B] pt-2 border-t border-[#E7E0D8]">
            <span>Filtrelenmiş sonuçlar görüntüleniyor.</span>
            <button
              onClick={resetFilters}
              className="text-[#1C1917] font-semibold hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Filtreleri Sıfırla
            </button>
          </div>
        )}
      </div>

      {/* Grid or List of Items */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#FAF8F5] border border-dashed border-[#D5C9BE] space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EAE2D5] text-[#5C5248] flex items-center justify-center mx-auto">
            <Shirt className="w-8 h-8 text-[#8C7A6B]" />
          </div>
          <div>
            <h3 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
              {items.length === 0
                ? 'Dolabınız Henüz Boş'
                : 'Aramanıza Uygun Kıyafet Bulunamadı'}
            </h3>
            <p className="text-xs sm:text-sm text-[#786C60] max-w-md mx-auto mt-1">
              {items.length === 0
                ? 'Kendi kıyafetlerinizin fotoğraflarını yükleyerek dijital gardırobunuzu hemen oluşturmaya başlayın veya ayarlar menüsünden örnek dolabı yükleyin.'
                : 'Seçili filtreleri temizleyerek veya farklı bir arama yaparak tekrar deneyin.'}
            </p>
          </div>
          {items.length === 0 ? (
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              İlk Kıyafeti Ekle
            </button>
          ) : (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FAF8F5] text-[#1C1917] border border-[#D5C9BE] hover:bg-[#F3EDE6] transition"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              onClick={() => onSelectItem(item)}
              onToggleFavorite={onToggleFavorite}
              onQuickLogWear={onQuickLogWear}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-[#FAF8F5] rounded-3xl border border-[#E7E0D8] divide-y divide-[#E7E0D8] overflow-hidden">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-[#F5EFEB] transition cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-14 h-16 rounded-xl object-cover bg-white border border-[#E7E0D8]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#EAE2D5] text-[#5C5248]">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    {item.brand && (
                      <span className="text-xs text-[#8C7A6B] font-medium">
                        {item.brand}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif-editorial text-base sm:text-lg font-bold text-[#1C1917] mt-0.5">
                    {item.name}
                  </h4>
                  <p className="text-xs text-[#786C60]">
                    {item.primaryColor} • {item.season} • {item.style}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-[#1C1917] block">
                    {item.wearCount} kez giyildi
                  </span>
                  {item.purchasePrice && (
                    <span className="text-[11px] text-[#8C7A6B]">
                      {item.purchasePrice.toLocaleString('tr-TR')} TL
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => onToggleFavorite(item.id, e)}
                  className={`p-2 rounded-full transition ${
                    item.isFavorite
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-[#8C7A6B] hover:bg-[#EAE2D5]'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
