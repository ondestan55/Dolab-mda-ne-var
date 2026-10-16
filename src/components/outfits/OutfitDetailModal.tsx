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
import { OutfitSilhouetteView } from './OutfitSilhouetteView';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-4xl rounded-3xl border border-[#E7E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E7E0D8] bg-[#F5EFEB]/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#1C1917] text-[#FAF8F5]">
              {outfit.style}
            </span>
            <span className="text-xs text-[#8C7A6B]">
              {outfit.occasion} • {outfit.season} • {currentItems.length} Parça
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
              title={outfit.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
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

              {/* Main Content: Left Column Mannequin Studio, Right Column Details & Swapping */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 6 cols: Mannequin Layered Silhouette */}
                <div className="lg:col-span-6 flex flex-col justify-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7A6B] mb-2 block">
                    Giydirilmiş Kombin Görünümü
                  </span>
                  <OutfitSilhouetteView
                    items={currentItems}
                    outfitName={outfit.name}
                    interactive={true}
                    onItemClick={(item) => setSwappingItemId(item.id)}
                    className="min-h-[420px]"
                  />
                  <p className="text-[11px] text-[#8C7A6B] text-center mt-2">
                    Değiştirmek istediğiniz parçanın üzerine tıklayabilirsiniz.
                  </p>
                </div>

                {/* Right 6 cols: Pieces list, descriptions, actions */}
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#44403C] mb-2">
                      Kombindeki Parçalar ({currentItems.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {currentItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#F7F4EE] rounded-xl border border-[#E7E0D8] p-2 flex items-center gap-2.5"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-14 rounded-lg object-contain bg-white shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-semibold text-[#8C7A6B] uppercase block">
                              {CATEGORY_LABELS[item.category]}
                            </span>
                            <span className="font-serif-editorial text-xs font-bold text-[#1C1917] block truncate">
                              {item.name}
                            </span>
                            <button
                              onClick={() => setSwappingItemId(item.id)}
                              className="text-[10px] text-[#4A5320] hover:underline font-semibold flex items-center gap-0.5 mt-0.5"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Değiştir</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Swap Piece Drawer */}
                  {swappingItemId && itemToSwap && (
                    <div className="p-3.5 rounded-2xl bg-[#F0EBE1] border border-[#DDD4C7] space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-[#1C1917]">
                            "{itemToSwap.name}" yerine seçin:
                          </span>
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
                        <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                          {candidateReplacements.map((cand) => (
                            <div
                              key={cand.id}
                              onClick={() => handleSwapItem(cand)}
                              className="p-1.5 rounded-xl bg-white border border-[#D5C9BE] hover:border-[#1C1917] cursor-pointer transition flex items-center gap-2"
                            >
                              <img
                                src={cand.imageUrl}
                                alt={cand.name}
                                className="w-8 h-10 rounded-lg object-contain bg-[#FAF8F5]"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-semibold text-[#1C1917] block truncate">
                                  {cand.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Editorial Advice Notes */}
                  <div className="space-y-2.5 bg-[#FAF8F5] rounded-2xl border border-[#E7E0D8] p-4">
                    {outfit.description && (
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7A6B] block">
                          Stil Notu
                        </span>
                        <p className="text-xs text-[#44403C] mt-0.5 leading-relaxed">
                          {outfit.description}
                        </p>
                      </div>
                    )}

                    {outfit.colorHarmonyReasoning && (
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7A6B] block">
                          Renk & Katman Uyumu
                        </span>
                        <p className="text-xs text-[#5C5248] mt-0.5 leading-relaxed italic">
                          {outfit.colorHarmonyReasoning}
                        </p>
                      </div>
                    )}

                    {outfit.stylingTips && (
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7A6B] block">
                          Küratör İpucu
                        </span>
                        <p className="text-xs text-[#4A5320] mt-0.5 leading-relaxed font-medium">
                          ✦ {outfit.stylingTips}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-4 border-t border-[#E7E0D8] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLogWear(outfit.id, outfit.itemIds)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Bugün Giydim ({outfit.wearCount})</span>
                  </button>

                  <button
                    onClick={() => onSchedule(outfit)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white text-[#44403C] border border-[#D5C9BE] hover:bg-[#F3EDE6] transition"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Haftalık Plana Ekle</span>
                  </button>

                  <button
                    onClick={handleDuplicate}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#786C60] hover:bg-[#EAE2D5] transition"
                    title="Kombini Kopyala"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kopyala</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kombini Sil</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
