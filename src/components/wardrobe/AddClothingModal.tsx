import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  ClothingItem,
  CategoryType,
  CATEGORY_LABELS,
  SEASONS,
  STYLES,
  OCCASIONS,
  SeasonType,
  StyleType,
  OccasionType,
} from '../../types/wardrobe';
import { validateImageFile, processAndCompressImage } from '../../utils/imageUtils';
import { analyzeClothingPhoto } from '../../services/api';

interface AddClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ClothingItem) => Promise<void>;
  hasGeminiKey: boolean;
}

export const AddClothingModal: React.FC<AddClothingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  hasGeminiKey,
}) => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisConfidence, setAnalysisConfidence] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pairingTip, setPairingTip] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('top');
  const [subcategory, setSubcategory] = useState('');
  const [primaryColor, setPrimaryColor] = useState('Siyah');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [pattern, setPattern] = useState('Düz');
  const [fabric, setFabric] = useState('');
  const [season, setSeason] = useState<SeasonType>('Dört Mevsim');
  const [style, setStyle] = useState<StyleType>('Smart Casual');
  const [occasion, setOccasion] = useState<OccasionType>('Günlük Hayat');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setPhotoDataUrl(null);
    setPhotoMimeType('image/jpeg');
    setIsAnalyzing(false);
    setAnalysisConfidence(null);
    setErrorMessage(null);
    setPairingTip('');
    setName('');
    setCategory('top');
    setSubcategory('');
    setPrimaryColor('Siyah');
    setSecondaryColor('');
    setPattern('Düz');
    setFabric('');
    setSeason('Dört Mevsim');
    setStyle('Smart Casual');
    setOccasion('Günlük Hayat');
    setBrand('');
    setSize('');
    setPurchasePrice('');
    setPurchaseDate('');
    setNotes('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Geçersiz dosya.');
      return;
    }

    try {
      const { dataUrl, mimeType } = await processAndCompressImage(file);
      setPhotoDataUrl(dataUrl);
      setPhotoMimeType(mimeType);

      // Auto-trigger AI analysis if key is available
      if (hasGeminiKey) {
        handleRunAiAnalysis(dataUrl, mimeType);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Fotoğraf işlenirken hata oluştu.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Geçersiz dosya.');
      return;
    }

    try {
      const { dataUrl, mimeType } = await processAndCompressImage(file);
      setPhotoDataUrl(dataUrl);
      setPhotoMimeType(mimeType);

      if (hasGeminiKey) {
        handleRunAiAnalysis(dataUrl, mimeType);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Fotoğraf işlenirken hata oluştu.');
    }
  };

  const handleRunAiAnalysis = async (imgData?: string, mime?: string) => {
    const dataToAnalyze = imgData || photoDataUrl;
    const mimeToAnalyze = mime || photoMimeType;

    if (!dataToAnalyze) {
      setErrorMessage('Lütfen önce bir kıyafet fotoğrafı yükleyin.');
      return;
    }

    if (!hasGeminiKey) {
      setErrorMessage(
        'Gemini API anahtarı sunucuda yapılandırılmamış. Kıyafet bilgilerinizi aşağıdan manuel olarak girebilirsiniz.'
      );
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStep('Görsel taranıyor ve silüet belirleniyor...');

    try {
      const stepTimer1 = setTimeout(() => {
        setAnalysisStep('Renk paleti, kumaş dokusu ve desen çözümleniyor...');
      }, 1000);

      const stepTimer2 = setTimeout(() => {
        setAnalysisStep('Mevsim ve stil sınıflandırması yapılıyor...');
      }, 2000);

      const result = await analyzeClothingPhoto(dataToAnalyze, mimeToAnalyze);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      // Populate form fields with analyzed data
      if (result.name) setName(result.name);
      if (result.category) setCategory(result.category);
      if (result.subcategory) setSubcategory(result.subcategory);
      if (result.primaryColor) setPrimaryColor(result.primaryColor);
      if (result.secondaryColor) setSecondaryColor(result.secondaryColor);
      if (result.pattern) setPattern(result.pattern);
      if (result.fabric) setFabric(result.fabric);
      if (result.style) setStyle(result.style);
      if (result.season) setSeason(result.season);
      if (result.occasion) setOccasion(result.occasion);
      if (result.pairingSuggestions) setPairingTip(result.pairingSuggestions);
      if (result.confidence !== undefined) setAnalysisConfidence(result.confidence);
    } catch (err: any) {
      console.error('AI analysis error:', err);
      setErrorMessage(
        'Yapay zekâ analizi tamamlanamadı (' +
          (err.message || 'Bilinmeyen hata') +
          '). Bilgileri manuel olarak girebilirsiniz.'
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoDataUrl) {
      setErrorMessage('Lütfen kıyafet için bir fotoğraf yükleyin.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Lütfen kıyafete bir isim verin.');
      return;
    }

    setIsSaving(true);
    try {
      const newItem: ClothingItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: name.trim(),
        imageUrl: photoDataUrl,
        category,
        subcategory: subcategory.trim() || CATEGORY_LABELS[category],
        primaryColor,
        secondaryColor: secondaryColor.trim() || undefined,
        pattern,
        season,
        style,
        occasion,
        brand: brand.trim() || undefined,
        size: size.trim() || undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        purchaseDate: purchaseDate || undefined,
        wearCount: 0,
        status: 'active',
        notes: notes.trim() || undefined,
        isFavorite: false,
        isDemoItem: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await onSave(newItem);
      handleResetForm();
      onClose();
    } catch (err: any) {
      setErrorMessage('Kayıt sırasında hata oluştu: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-3xl rounded-3xl border border-[#E7E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E7E0D8] flex items-center justify-between bg-[#F5EFEB]/70">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8C7A6B]">
              Gardırop Kaydı
            </span>
            <h2 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
              Yeni Kıyafet Ekle
            </h2>
          </div>
          <button
            onClick={() => {
              handleResetForm();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-[#EAE2D5] text-[#786C60] hover:text-[#1C1917] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Photo Upload & Preview Section */}
          <div>
            <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-2">
              1. Kıyafet Fotoğrafı
            </label>

            {!photoDataUrl ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D5C9BE] hover:border-[#8C7A6B] bg-[#F7F4EE] rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-full bg-[#EAE2D5] group-hover:bg-[#DFD5C6] flex items-center justify-center text-[#5C5248] transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#292524]">
                    Fotoğrafı buraya sürükleyin veya seçin
                  </p>
                  <p className="text-xs text-[#8C7A6B] mt-1">
                    JPEG, PNG veya WebP (Otomatik optimize edilir)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="relative rounded-2xl border border-[#E7E0D8] bg-[#F7F4EE] p-4 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-36 h-44 rounded-xl overflow-hidden bg-white border border-[#E7E0D8] shrink-0 shadow-xs">
                  <img
                    src={photoDataUrl}
                    alt="Kıyafet Ön İzleme"
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5C5248]">
                      Fotoğraf Başarıyla Yüklendi
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoDataUrl(null);
                        setAnalysisConfidence(null);
                      }}
                      className="text-xs text-rose-700 hover:text-rose-900 underline font-medium"
                    >
                      Farklı Fotoğraf Seç
                    </button>
                  </div>

                  {/* AI Analysis Button & Status */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E7E0D8]">
                    {isAnalyzing ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-[#8C7A6B] animate-spin shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-[#1C1917]">
                            Gemini AI Fotoğrafı Analiz Ediyor...
                          </p>
                          <p className="text-[11px] text-[#786C60] animate-pulse">
                            {analysisStep}
                          </p>
                        </div>
                      </div>
                    ) : analysisConfidence !== null ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            AI Analizi Tamamlandı
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 font-medium">
                            Güven: %{Math.round(analysisConfidence * 100)}
                          </span>
                        </div>
                        {pairingTip && (
                          <p className="text-xs text-[#5C5248] italic bg-white/70 p-2 rounded-lg border border-[#EBE4DA]">
                            "{pairingTip}"
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRunAiAnalysis()}
                          className="inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#1C1917] mt-1 font-medium"
                        >
                          <RefreshCw className="w-3 h-3" /> Yeniden Analiz Et
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-xs text-[#6B5E52]">
                          {hasGeminiKey
                            ? 'Gemini 3.8 Flash ile kıyafetin renk, kumaş ve stilini saniyeler içinde otomatik tespit edin.'
                            : 'Sunucu AI anahtarı bağlı değil. Bilgileri manuel girebilirsiniz.'}
                        </p>
                        {hasGeminiKey && (
                          <button
                            type="button"
                            onClick={() => handleRunAiAnalysis()}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shrink-0 shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#E6DEC8]" />
                            AI ile Analiz Et
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Details */}
          <form id="clothing-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-2">
              <span className="text-xs font-semibold text-[#44403C] uppercase tracking-wider">
                2. Kıyafet Detayları (Kontrol Et & Düzenle)
              </span>
              <span className="text-[11px] text-[#8C7A6B]">
                * zorunlu alanlar
              </span>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-[#44403C] mb-1">
                Kıyafet Adı *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ör. Ekru Kaşmir Triko Kazak, Koyu Indigo Slim Jean"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917]"
              />
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Ana Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] focus:outline-hidden focus:border-[#1C1917]"
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
                  placeholder="ör. Kazak, Tişört, Kot Pantolon, Blazer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
                />
              </div>
            </div>

            {/* Colors & Pattern */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Ana Renk *
                </label>
                <input
                  type="text"
                  required
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="ör. Siyah, Beyaz, Krem, Bej, Haki"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  İkincil Renk (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="ör. Krem, Altın, Çizgi rengi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
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
                  placeholder="ör. Düz, Çizgili, Ekose, Baskılı"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
                />
              </div>
            </div>

            {/* Fabric, Season & Style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Kumaş / Doku
                </label>
                <input
                  type="text"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  placeholder="ör. Pamuk, Keten, Yün, Kaşmir, Denim"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Mevsim
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value as SeasonType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] focus:outline-hidden focus:border-[#1C1917]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] focus:outline-hidden focus:border-[#1C1917]"
                >
                  {STYLES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Occasion, Brand, Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Kullanım Ortamı
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value as OccasionType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] focus:outline-hidden focus:border-[#1C1917]"
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Marka (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="ör. Zara, Massimo Dutti, COS"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Beden (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="ör. S, M, 38, 30/32"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
                />
              </div>
            </div>

            {/* Price & Purchase Date for Cost-Per-Wear */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1 flex items-center justify-between">
                  <span>Satın Alma Fiyatı (TL, İsteğe bağlı)</span>
                  <span className="text-[10px] text-[#8C7A6B]">Kullanım maliyeti hesabı için</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="ör. 1850"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Satın Alma Tarihi (İsteğe bağlı)
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] focus:outline-hidden focus:border-[#1C1917]"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-[#44403C] mb-1">
                Kişisel Notlar
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ör. Kuru temizleme önerilir. Triko eteklerle çok yakışıyor."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E7E0D8] bg-[#F5EFEB]/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              handleResetForm();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[#5C5248] hover:bg-[#EAE2D5] transition"
          >
            İptal
          </button>

          <button
            type="submit"
            form="clothing-form"
            disabled={isSaving || !photoDataUrl}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm ${
              !photoDataUrl || isSaving
                ? 'bg-[#D5C9BE] text-[#8C7A6B] cursor-not-allowed'
                : 'bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] active:scale-98'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Dolaba Kaydet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
