import React, { useState } from 'react';
import {
  X,
  Heart,
  Calendar,
  PlusCircle,
  Trash2,
  Edit2,
  Copy,
  Star,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Outfit, ClothingItem, CATEGORY_LABELS } from '../../types/wardrobe';

interface OutfitDetailModalProps {
  outfit: Outfit | null;
  isOpen: boolean;
  onClose: () => void;
  itemsMap: Map<string, ClothingItem>;
  allItems: ClothingItem[];
  onUpdateOutfit: (updated: Outfit) => Promise<void>;
  onDeleteOutfit: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => void;
  onLogWear: (outfitId: string, itemIds: string[]) => void;
  onSchedule: (outfit: Outfit) => void;
}

export const OutfitDetailModal: React.FC<OutfitDetailModalProps> = ({
  outfit,
  isOpen,
  onClose,
  itemsMap,
  allItems,
  onUpdateOutfit,
  onDeleteOutfit,
  onToggleFavorite,
  onLogWear,
  onSchedule,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [swappingItemId, setSwappingItemId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !outfit) return null;

  const currentItems = outfit.itemIds
    .map((id) => itemsMap.get(id))
    .filter((item): item is ClothingItem => item !== undefined);

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    await onUpdateOutfit({ ...outfit, name: editedName.trim() });
    setIsEditingName(false);
  };

  const handleDuplicate = async () => {
    const copy: Outfit = {
      ...outfit,
      id: 'outfit_copy_' + Date.now(),
      name: `${outfit.name} (Kopya)`,
      createdAt: Date.now(),
      wearCount: 0,
      isDemoOutfit: false,
    };
    await onUpdateOutfit(copy);
    alert('Kombin kopyalandı ve kombinlerinize eklendi.');
  };

  const handleSetRating = async (rating: number) => {
    await onUpdateOutfit({ ...outfit, rating });
  };

  // Swap piece handler: replace swappingItemId with newItemId
  const handleSwapItem = async (replacementItem: ClothingItem) => {
    if (!swappingItemId) return;
    const newItemIds = outfit.itemIds.map((id) =>
      id === swappingItemId ? replacementItem.id : id
    );
    await onUpdateOutfit({ ...outfit, itemIds: newItemIds });
    setSwappingItemId(null);
  };

  // Candidate replacement items for the piece being swapped (same category)
  const itemToSwap = swappingItemId ? itemsMap.get(swappingItemId) : null;
  const candidateReplacements = itemToSwap
    ? allItems.filter(
        (i) =>
          i.category === itemToSwap.category &&
          i.id !== itemToSwap.id &&
          !outfit.itemIds.includes(i.id)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-3xl rounded-3xl border border-[#E7E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E7E0D8] bg-[#F5EFEB]/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#1C1917] text-[#FAF8F5]">
              {outfit.style}
            </span>
            <span className="text-xs text-[#8C7A6B]">
              {outfit.occasion} • {outfit.season}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(outfit.id)}
              className={`p-2 rounded-full transition ${
                outfit.isFavorite
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : 'hover:bg-[#EAE2D5] text-[#786C60]'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${outfit.isFavorite ? 'fill-current' : ''}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#EAE2D5] text-[#786C60] hover:text-[#1C1917] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {showDeleteConfirm ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif-editorial text-2xl font-bold text-rose-950">
                  Kombini silmek istediğinize emin misiniz?
                </h3>
                <p className="text-xs sm:text-sm text-rose-800 max-w-md mx-auto mt-1">
                  "{outfit.name}" kalıcı olarak silinecek. (Kıyafetleriniz dolabınızda kalmaya devam eder.)
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-white text-rose-900 border border-rose-300 hover:bg-rose-100"
                >
                  Vazgeç
                </button>
                <button
                  onClick={async () => {
                    await onDeleteOutfit(outfit.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-700 text-white hover:bg-rose-800"
                >
                  Evet, Kombini Sil
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Title & Edit Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {isEditingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#1C1917] text-lg font-bold font-serif-editorial text-[#1C1917] flex-1"
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-3 py-1.5 rounded-xl bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="px-3 py-1.5 rounded-xl bg-[#EAE2D5] text-[#5C5248] text-xs"
                    >
                      İptal
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1C1917]">
                      {outfit.name}
                    </h2>
                    <button
                      onClick={() => {
                        setEditedName(outfit.name);
                        setIsEditingName(true);
                      }}
                      className="text-[#8C7A6B] hover:text-[#1C1917] p-1"
                      title="İsmi Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Rating 1-5 Stars */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleSetRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition"
                      title={`${star} yıldız ver`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          (outfit.rating || 0) >= star
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-[#D5C9BE]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Items in this outfit (with Swap Piece feature) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">
                    Kombindeki Parçalar ({currentItems.length})
                  </h4>
                  <span className="text-[11px] text-[#8C7A6B]">
                    Parçayı değiştirmek için üzerindeki "Değiştir" butonuna tıklayın
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#F7F4EE] rounded-2xl border border-[#E7E0D8] p-2.5 flex flex-col justify-between group"
                    >
                      <div className="aspect-4/5 rounded-xl overflow-hidden bg-white mb-2">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[#8C7A6B] uppercase block">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                        <h5 className="font-serif-editorial text-xs sm:text-sm font-bold text-[#1C1917] line-clamp-1">
                          {item.name}
                        </h5>
                      </div>
                      <button
                        onClick={() => setSwappingItemId(item.id)}
                        className="mt-2 w-full py-1 rounded-lg text-[11px] font-semibold text-[#5C5248] bg-white border border-[#DDD4C7] hover:bg-[#FAF8F5] transition flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Değiştir</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Swap Piece Selector Drawer */}
              {swappingItemId && itemToSwap && (
                <div className="p-4 rounded-2xl bg-[#F0EBE1] border border-[#DDD4C7] space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[#1C1917]">
                        "{itemToSwap.name}" yerine dolaptan başka bir parça seçin:
                      </span>
                      <p className="text-[11px] text-[#786C60]">
                        Kategori: {CATEGORY_LABELS[itemToSwap.category]}
                      </p>
                    </div>
                    <button
                      onClick={() => setSwappingItemId(null)}
                      className="text-xs font-medium text-[#786C60] hover:text-[#1C1917]"
                    >
                      Kapat
                    </button>
                  </div>

                  {candidateReplacements.length === 0 ? (
                    <p className="text-xs text-[#8C7A6B] italic">
                      Dolabınızda bu kategoride başka uygun alternatif bulunamadı.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {candidateReplacements.map((cand) => (
                        <div
                          key={cand.id}
                          onClick={() => handleSwapItem(cand)}
                          className="p-2 rounded-xl bg-white border border-[#D5C9BE] hover:border-[#1C1917] cursor-pointer transition flex items-center gap-2"
                        >
                          <img
                            src={cand.imageUrl}
                            alt={cand.name}
                            className="w-10 h-12 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-[#1C1917] block truncate">
                              {cand.name}
                            </span>
                            <span className="text-[10px] text-[#8C7A6B] block">
                              {cand.primaryColor}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rationale & Styling Notes */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#E7E0D8] space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-[#1C1917] block">
                      Stilist Açıklaması:
                    </span>
                    <p className="text-[#5C5248] leading-relaxed mt-0.5">
                      {outfit.description}
                    </p>
                  </div>

                  {outfit.colorHarmonyReasoning && (
                    <div className="pt-2 border-t border-[#E7E0D8]">
                      <span className="font-semibold text-[#1C1917] block">
                        Renk & Doku Uyumu:
                      </span>
                      <p className="text-[#5C5248] leading-relaxed mt-0.5">
                        {outfit.colorHarmonyReasoning}
                      </p>
                    </div>
                  )}

                  {outfit.weatherSuitability && (
                    <div className="pt-2 border-t border-[#E7E0D8]">
                      <span className="font-semibold text-[#1C1917] block">
                        Mevsim & Hava Koşulu:
                      </span>
                      <p className="text-[#5C5248] leading-relaxed mt-0.5">
                        {outfit.weatherSuitability}
                      </p>
                    </div>
                  )}

                  {outfit.stylingTips && (
                    <div className="pt-2 border-t border-[#E7E0D8]">
                      <span className="font-semibold text-[#1C1917] block">
                        Stil İpucu:
                      </span>
                      <p className="text-[#5C5248] leading-relaxed mt-0.5">
                        {outfit.stylingTips}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Actions Bar */}
        {!showDeleteConfirm && (
          <div className="px-6 py-4 border-t border-[#E7E0D8] bg-[#F5EFEB]/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-100/70 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Kombini Sil</span>
              </button>

              <button
                onClick={handleDuplicate}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#5C5248] hover:bg-[#EAE2D5] transition"
              >
                <Copy className="w-4 h-4" />
                <span>Kopyala</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  onSchedule(outfit);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FAF8F5] text-[#1C1917] border border-[#D5C9BE] hover:bg-[#F3EDE6] transition"
              >
                <Calendar className="w-4 h-4 text-[#8C7A6B]" />
                <span>Takvime Planla</span>
              </button>

              <button
                onClick={() => {
                  onLogWear(outfit.id, outfit.itemIds);
                  alert('Kombin bugün giyildi olarak işaretlendi (+1)!');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs active:scale-98"
              >
                <PlusCircle className="w-4 h-4 text-[#E6DEC8]" />
                <span>Bugün Giydim (+1)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
