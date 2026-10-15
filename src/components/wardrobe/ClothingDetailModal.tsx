import React, { useState } from 'react';
import {
  X,
  Heart,
  Edit2,
  Trash2,
  PlusCircle,
  Calendar,
  Tag,
  DollarSign,
  Shirt,
  Sparkles,
  Check,
  AlertTriangle,
  Upload,
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
import { validateImageFile, processAndCompressImage } from '../../utils/imageUtils';

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

  // Editable fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('top');
  const [subcategory, setSubcategory] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [pattern, setPattern] = useState('');
  const [season, setSeason] = useState<SeasonType>('Dört Mevsim');
  const [style, setStyle] = useState<StyleType>('Casual');
  const [occasion, setOccasion] = useState<OccasionType>('Günlük Hayat');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'laundry' | 'archived'>('active');
  const [notes, setNotes] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);

  // Sync state when entering edit mode
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
    setBrand(item.brand || '');
    setSize(item.size || '');
    setPurchasePrice(item.purchasePrice ? item.purchasePrice.toString() : '');
    setStatus(item.status);
    setNotes(item.notes || '');
    setNewPhotoUrl(null);
    setIsEditing(true);
  };

  if (!isOpen || !item) return null;

  // Calculate Cost Per Wear
  const costPerWear =
    item.purchasePrice && item.wearCount > 0
      ? Math.round(item.purchasePrice / item.wearCount)
      : item.purchasePrice
      ? item.purchasePrice
      : null;

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated: ClothingItem = {
        ...item,
        name: name.trim() || item.name,
        imageUrl: newPhotoUrl || item.imageUrl,
        category,
        subcategory: subcategory.trim() || item.subcategory,
        primaryColor: primaryColor.trim() || item.primaryColor,
        secondaryColor: secondaryColor.trim() || undefined,
        pattern: pattern.trim() || item.pattern,
        season,
        style,
        occasion,
        brand: brand.trim() || undefined,
        size: size.trim() || undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    const { dataUrl } = await processAndCompressImage(file);
    setNewPhotoUrl(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-3xl rounded-3xl border border-[#E7E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E7E0D8] bg-[#F5EFEB]/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#1C1917] text-[#FAF8F5]">
              {CATEGORY_LABELS[item.category] || item.category}
            </span>
            {item.isDemoItem && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAE2D5] text-[#6B5E52] border border-[#D5C9BE]">
                Örnek Parça
              </span>
            )}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {showDeleteConfirm ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4 my-auto">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif-editorial text-2xl font-bold text-rose-950">
                  Bu kıyafeti silmek istediğinizden emin misiniz?
                </h3>
                <p className="text-xs sm:text-sm text-rose-800 max-w-md mx-auto mt-2">
                  "{item.name}" kalıcı olarak dolabınızdan kaldırılacak. Eğer bu parça herhangi bir kombinde yer alıyorsa, kombin güncellenecektir.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white text-rose-900 border border-rose-300 hover:bg-rose-100 transition"
                >
                  Vazgeç
                </button>
                <button
                  onClick={async () => {
                    await onDelete(item.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-700 text-white hover:bg-rose-800 transition shadow-sm"
                >
                  Evet, Kıyafeti Sil
                </button>
              </div>
            </div>
          ) : isEditing ? (
            /* EDIT FORM */
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7E0D8]">
                <h3 className="font-serif-editorial text-xl font-bold text-[#1C1917]">
                  Kıyafet Bilgilerini Düzenle
                </h3>
                <label className="cursor-pointer text-xs font-semibold text-[#8C7A6B] hover:text-[#1C1917] flex items-center gap-1.5 underline">
                  <Upload className="w-3.5 h-3.5" />
                  Fotoğrafı Değiştir
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>

              {newPhotoUrl && (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-[#F0EBE1] border border-[#DDD4C7]">
                  <img
                    src={newPhotoUrl}
                    alt="Yeni"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <span className="text-xs text-[#5C5248]">
                    Yeni fotoğraf seçildi, kaydettiğinizde güncellenecek.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Kıyafet Adı
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Ana Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  >
                    {(Object.keys(CATEGORY_LABELS) as CategoryType[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Alt Kategori
                  </label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Ana Renk
                  </label>
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    İkincil Renk
                  </label>
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Desen
                  </label>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Mevsim
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value as SeasonType)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  >
                    {SEASONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Stil
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as StyleType)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  >
                    {STYLES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Kullanım Ortamı
                  </label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value as OccasionType)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  >
                    {OCCASIONS.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Marka
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Beden
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Satın Alma Fiyatı (TL)
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Kullanım Durumu
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  >
                    <option value="active">Aktif (Dolapta)</option>
                    <option value="laundry">Çamaşırda / Temizlemede</option>
                    <option value="archived">Arşivlendi (Mevsim dışı)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1">
                    Notlar
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E0D8]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#5C5248] hover:bg-[#EAE2D5]"
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
          ) : (
            /* VIEW DETAILS */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Photo & Wear Tracker Column */}
              <div className="md:col-span-5 space-y-4">
                <div className="aspect-4/5 rounded-2xl overflow-hidden bg-[#F3EDE6] border border-[#E7E0D8] shadow-xs">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Wear Counter Action */}
                <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E5DCcf] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#6B5E52]">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      Kullanım Sayacı
                    </span>
                    <span className="font-bold text-[#1C1917]">
                      {item.wearCount} kez giyildi
                    </span>
                  </div>
                  <button
                    onClick={() => onLogWear(item.id)}
                    className="w-full py-2 px-3 rounded-xl bg-[#1C1917] hover:bg-[#38332E] text-[#FAF8F5] text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98 shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4 text-[#E6DEC8]" />
                    <span>Bugün Giydim (+1 Kaydet)</span>
                  </button>
                </div>

                {/* Cost Per Wear (Kullanım Başına Maliyet) */}
                {costPerWear !== null && (
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E0D8] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[#8C7A6B]">
                      <span>Kullanım Başına Maliyet:</span>
                      <span className="font-bold text-base text-[#2E5A36]">
                        {costPerWear.toLocaleString('tr-TR')} TL
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8C7A6B]">
                      {item.purchasePrice?.toLocaleString('tr-TR')} TL /{' '}
                      {Math.max(1, item.wearCount)} giyim
                    </p>
                  </div>
                )}
              </div>

              {/* Details Column */}
              <div className="md:col-span-7 space-y-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#8C7A6B]">
                    {item.brand || 'Özel Koleksiyon'}
                  </span>
                  <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] mt-0.5 leading-tight">
                    {item.name}
                  </h2>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                      item.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : item.status === 'laundry'
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.status === 'active'
                          ? 'bg-emerald-600'
                          : item.status === 'laundry'
                          ? 'bg-amber-600'
                          : 'bg-stone-400'
                      }`}
                    />
                    {item.status === 'active'
                      ? 'Dolapta / Kullanıma Hazır'
                      : item.status === 'laundry'
                      ? 'Çamaşırda / Bakımda'
                      : 'Arşivlendi'}
                  </span>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E7E0D8]">
                    <span className="block text-[10px] uppercase font-semibold text-[#8C7A6B]">
                      Alt Kategori
                    </span>
                    <span className="font-medium text-[#1C1917] mt-0.5 block">
                      {item.subcategory || '-'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E7E0D8]">
                    <span className="block text-[10px] uppercase font-semibold text-[#8C7A6B]">
                      Renkler
                    </span>
                    <span className="font-medium text-[#1C1917] mt-0.5 block">
                      {item.primaryColor}
                      {item.secondaryColor ? ` / ${item.secondaryColor}` : ''}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E7E0D8]">
                    <span className="block text-[10px] uppercase font-semibold text-[#8C7A6B]">
                      Mevsim & Stil
                    </span>
                    <span className="font-medium text-[#1C1917] mt-0.5 block">
                      {item.season} • {item.style}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E7E0D8]">
                    <span className="block text-[10px] uppercase font-semibold text-[#8C7A6B]">
                      Kullanım Ortamı
                    </span>
                    <span className="font-medium text-[#1C1917] mt-0.5 block">
                      {item.occasion}
                    </span>
                  </div>

                  {item.pattern && (
                    <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E7E0D8]">
                      <span className="block text-[10px] uppercase font-semibold text-[#8C7A6B]">
                        Desen
                      </span>
                      <span className="font-medium text-[#1C1917] mt-0.5 block">
                        {item.pattern}
                      </span>
                    </div>
                  )}

                  {item.size && (
                    <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E7E0D8]">
                      <span className="block text-[10px] uppercase font-semibold text-[#8C7A6B]">
                        Beden
                      </span>
                      <span className="font-medium text-[#1C1917] mt-0.5 block">
                        {item.size}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {item.notes && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E7E0D8]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7A6B] block mb-1">
                      Özel Notlar
                    </span>
                    <p className="text-xs text-[#44403C] leading-relaxed">
                      {item.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        {!isEditing && !showDeleteConfirm && (
          <div className="px-6 py-4 border-t border-[#E7E0D8] bg-[#F5EFEB]/70 flex items-center justify-between">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-100/70 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Kıyafeti Sil</span>
            </button>

            <button
              onClick={enterEditMode}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs"
            >
              <Edit2 className="w-4 h-4" />
              <span>Düzenle</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
