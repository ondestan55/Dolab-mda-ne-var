import React, { useState } from 'react';
import {
  X,
  Heart,
  Edit2,
  Trash2,
  PlusCircle,
  Calendar,
  Shirt,
  Sparkles,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  ClothingItem,
  CATEGORY_LABELS,
  CategoryType,
  SEASONS,
  STYLES,
  OCCASIONS,
  SeasonType,
  StyleType,
  OccasionType,
} from '../../types/wardrobe';

interface ClothingDetailModalProps {
  item: ClothingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (item: ClothingItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => void;
  onLogWear: (id: string) => void;
}

export const ClothingDetailModal: React.FC<ClothingDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onToggleFavorite,
  onLogWear,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields (No brand, size, price, date)
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('top');
  const [subcategory, setSubcategory] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [pattern, setPattern] = useState('');
  const [season, setSeason] = useState<SeasonType>('Dört Mevsim');
  const [style, setStyle] = useState<StyleType>('Casual');
  const [occasion, setOccasion] = useState<OccasionType>('Günlük Hayat');
  const [status, setStatus] = useState<'active' | 'laundry' | 'archived'>('active');
  const [notes, setNotes] = useState('');

  const enterEditMode = () => {
    if (!item) return;
    setName(item.name);
    setCategory(item.category);
    setSubcategory(item.subcategory || '');
    setPrimaryColor(item.primaryColor);
    setSecondaryColor(item.secondaryColor || '');
    setPattern(item.pattern || '');
    setSeason(item.season);
    setStyle(item.style);
    setOccasion(item.occasion);
    setStatus(item.status);
    setNotes(item.notes || '');
    setIsEditing(true);
  };

  if (!isOpen || !item) return null;

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated: ClothingItem = {
        ...item,
        name: name.trim() || item.name,
        category,
        subcategory: subcategory.trim() || item.subcategory,
        primaryColor: primaryColor.trim() || item.primaryColor,
        secondaryColor: secondaryColor.trim() || undefined,
        pattern: pattern.trim() || item.pattern,
        season,
        style,
        occasion,
        status,
        notes: notes.trim() || undefined,
        updatedAt: Date.now(),
      };
      await onUpdate(updated);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-3xl rounded-3xl border border-[#E7E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E0D8] bg-[#F5EFEB]/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#1C1917] text-[#FAF8F5]">
              {CATEGORY_LABELS[item.category]}
            </span>
            <span className="text-xs text-[#8C7A6B]">
              {item.subcategory}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(item.id)}
              className={`p-2 rounded-full transition ${
                item.isFavorite
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : 'hover:bg-[#EAE2D5] text-[#786C60]'
              }`}
              title={item.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            >
              <Heart
                className={`w-5 h-5 ${item.isFavorite ? 'fill-current' : ''}`}
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {showDeleteConfirm ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif-editorial text-2xl font-bold text-rose-950">
                  Bu kıyafeti silmek istiyor musunuz?
                </h3>
                <p className="text-xs sm:text-sm text-rose-800 max-w-md mx-auto mt-1">
                  "{item.name}" gardırobunuzdan ve kaydedilmiş kombinlerinizden kaldırılacak.
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
                    await onDelete(item.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-700 text-white hover:bg-rose-800"
                >
                  Evet, Kıyafeti Sil
                </button>
              </div>
            </div>
          ) : !isEditing ? (
            /* VIEW MODE */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Photo on Studio Surface */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative w-full aspect-3/4 rounded-2xl overflow-hidden bg-radial from-[#FAF9F6] to-[#EAE4DC] border border-[#E7E0D8] p-4 flex items-center justify-center shadow-inner">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-contain drop-shadow-xl"
                  />
                </div>

                {/* Quick Log Wear Button */}
                <button
                  onClick={() => onLogWear(item.id)}
                  className="mt-3 w-full py-2.5 rounded-xl bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold hover:bg-[#38332E] transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Bugün Giydim ({item.wearCount} kez)</span>
                </button>
              </div>

              {/* Information Details */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8C7A6B]">
                      {item.subcategory}
                    </span>
                    <button
                      onClick={enterEditMode}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#4A5320] hover:underline"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </button>
                  </div>
                  <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] mt-0.5">
                    {item.name}
                  </h2>
                </div>

                {/* Core Fashion Specs Grid */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F7F4EE] border border-[#E7E0D8]">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7A6B] block">
                      Renk
                    </span>
                    <span className="text-xs font-semibold text-[#1C1917]">
                      {item.primaryColor}
                      {item.secondaryColor ? ` (${item.secondaryColor})` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7A6B] block">
                      Desen
                    </span>
                    <span className="text-xs font-semibold text-[#1C1917]">
                      {item.pattern || 'Düz'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7A6B] block">
                      Mevsim
                    </span>
                    <span className="text-xs font-semibold text-[#1C1917]">
                      {item.season}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7A6B] block">
                      Tarz / Stil
                    </span>
                    <span className="text-xs font-semibold text-[#1C1917]">
                      {item.style}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7A6B] block">
                      Kullanım Ortamı
                    </span>
                    <span className="text-xs font-semibold text-[#1C1917]">
                      {item.occasion}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7A6B] block">
                      Dolap Durumu
                    </span>
                    <span className="text-xs font-semibold text-[#1C1917]">
                      {item.status === 'active'
                        ? 'Temiz & Hazır'
                        : item.status === 'laundry'
                        ? 'Kirli / Çamaşırda'
                        : 'Arşivlendi'}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {item.notes && (
                  <div className="p-3 rounded-xl bg-white border border-[#E7E0D8] text-xs text-[#5C5248]">
                    <span className="font-semibold block text-[#1C1917] mb-0.5">Not:</span>
                    {item.notes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form id="edit-clothing-form" onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">
                  Kıyafet Adı
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">
                    Alt Kategori
                  </label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">
                    Ana Renk
                  </label>
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">
                    İkincil Renk
                  </label>
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">
                    Desen
                  </label>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">
                    Mevsim
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value as SeasonType)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs"
                  >
                    {SEASONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">
                    Stil
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as StyleType)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs"
                  >
                    {STYLES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">
                    Kullanım Ortamı
                  </label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value as OccasionType)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs"
                  >
                    {OCCASIONS.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7E0D8]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#786C60]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E]"
                >
                  {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          )}

          {/* Footer Delete Button when viewing */}
          {!isEditing && !showDeleteConfirm && (
            <div className="pt-4 border-t border-[#E7E0D8] flex items-center justify-between">
              <span className="text-[11px] text-[#8C7A6B]">
                {item.isDemoItem ? 'Örnek dolap parçası' : 'Kişisel parça'}
              </span>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kıyafeti Sil</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
