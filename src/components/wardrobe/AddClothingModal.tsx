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
  Image as ImageIcon,
  Wand2,
  Video,
  SwitchCamera,
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
import {
  validateImageFile,
  processAndCompressImage,
  removeClothingBackground,
} from '../../utils/imageUtils';
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
  const [rawOriginalUrl, setRawOriginalUrl] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string>('image/jpeg');
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isBgRemoved, setIsBgRemoved] = useState(false);

  // Live in-app camera state for Safari & WebRTC
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pairingTip, setPairingTip] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Simplified Form Fields: Pure Fashion (No brand, size, price, date)
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('top');
  const [subcategory, setSubcategory] = useState('');
  const [primaryColor, setPrimaryColor] = useState('Siyah');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [pattern, setPattern] = useState('Düz');
  const [season, setSeason] = useState<SeasonType>('Dört Mevsim');
  const [style, setStyle] = useState<StyleType>('Casual');
  const [occasion, setOccasion] = useState<OccasionType>('Günlük Hayat');
  const [notes, setNotes] = useState('');

  // Refs for iOS/Safari inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  const handleResetForm = () => {
    stopLiveCamera();
    setPhotoDataUrl(null);
    setRawOriginalUrl(null);
    setPhotoMimeType('image/jpeg');
    setIsRemovingBg(false);
    setIsBgRemoved(false);
    setIsAnalyzing(false);
    setAnalysisStatus(null);
    setErrorMessage(null);
    setPairingTip('');
    setName('');
    setCategory('top');
    setSubcategory('');
    setPrimaryColor('Siyah');
    setSecondaryColor('');
    setPattern('Düz');
    setSeason('Dört Mevsim');
    setStyle('Casual');
    setOccasion('Günlük Hayat');
    setNotes('');
  };

  // Start in-app video camera stream (Safari iOS compatible with playsinline)
  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    stopLiveCamera();
    setErrorMessage(null);
    setIsLiveCameraActive(true);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        await videoRef.current.play();
      }
    } catch (camErr: any) {
      console.warn('Live camera stream not supported or denied, native camera input is ready:', camErr);
      setIsLiveCameraActive(false);
      // Trigger native Apple camera input as fallback
      cameraInputRef.current?.click();
    }
  };

  const captureLivePhoto = async () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 960;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      stopLiveCamera();

      setRawOriginalUrl(dataUrl);
      setPhotoDataUrl(dataUrl);
      setPhotoMimeType('image/jpeg');

      // Auto background removal
      runBackgroundRemoval(dataUrl);
      // Auto AI analysis
      runAiAnalysis(dataUrl, 'image/jpeg');
    } catch (err: any) {
      setErrorMessage('Fotoğraf yakalanırken hata oluştu: ' + err.message);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Geçersiz görsel.');
      return;
    }

    try {
      const { dataUrl, mimeType } = await processAndCompressImage(file);
      setRawOriginalUrl(dataUrl);
      setPhotoDataUrl(dataUrl);
      setPhotoMimeType(mimeType);

      // Auto-run smart studio background removal
      runBackgroundRemoval(dataUrl);

      // Auto-trigger AI analysis
      runAiAnalysis(dataUrl, mimeType);
    } catch (err: any) {
      setErrorMessage(err.message || 'Fotoğraf işlenirken hata oluştu.');
    }
  };

  const runBackgroundRemoval = async (inputDataUrl: string) => {
    setIsRemovingBg(true);
    try {
      const cleanStudio = await removeClothingBackground(inputDataUrl, 'studio');
      setPhotoDataUrl(cleanStudio);
      setIsBgRemoved(true);
    } catch (bgErr) {
      console.warn('Background clean warning:', bgErr);
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleToggleBg = async () => {
    if (!rawOriginalUrl) return;

    if (isBgRemoved) {
      setPhotoDataUrl(rawOriginalUrl);
      setIsBgRemoved(false);
    } else {
      setIsRemovingBg(true);
      try {
        const cleanStudio = await removeClothingBackground(rawOriginalUrl, 'studio');
        setPhotoDataUrl(cleanStudio);
        setIsBgRemoved(true);
      } catch (err) {
        console.warn('Bg cleanup error:', err);
      } finally {
        setIsRemovingBg(false);
      }
    }
  };

  const runAiAnalysis = async (imgData?: string, mime?: string) => {
    const dataToAnalyze = imgData || photoDataUrl;
    const mimeToAnalyze = mime || photoMimeType;

    if (!dataToAnalyze) {
      setErrorMessage('Lütfen önce bir kıyafet fotoğrafı seçin.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatus('Yapay zekâ kıyafetinizi inceliyor...');

    try {
      const result = await analyzeClothingPhoto(dataToAnalyze, mimeToAnalyze);

      // Auto-populate form fields
      if (result.name) setName(result.name);
      if (result.category) setCategory(result.category);
      if (result.subcategory) setSubcategory(result.subcategory);
      if (result.primaryColor) setPrimaryColor(result.primaryColor);
      if (result.secondaryColor) setSecondaryColor(result.secondaryColor);
      if (result.pattern) setPattern(result.pattern);
      if (result.style) setStyle(result.style);
      if (result.season) setSeason(result.season);
      if (result.occasion) setOccasion(result.occasion);
      if (result.pairingSuggestions) setPairingTip(result.pairingSuggestions);

      setAnalysisStatus('Kıyafet detayları başarıyla tanımlandı ✓');
      setTimeout(() => setAnalysisStatus(null), 3500);
    } catch (err: any) {
      console.warn('AI analysis fallback:', err);
      if (!name) setName('Yeni Kıyafet');
      if (!subcategory) setSubcategory(CATEGORY_LABELS[category] || 'Üst Giyim');
      setAnalysisStatus('Temel bilgiler dolduruldu ✓');
      setTimeout(() => setAnalysisStatus(null), 3000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoDataUrl) {
      setErrorMessage('Lütfen kıyafet için bir fotoğraf yükleyin veya çekin.');
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-2xl rounded-3xl border border-[#E7E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E0D8] flex items-center justify-between bg-[#F5EFEB]/80">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8C7A6B]">
              Dolap Kaydı
            </span>
            <h2 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
              Kıyafet Ekle
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
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {analysisStatus && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{analysisStatus}</span>
            </div>
          )}

          {/* 1. Photo Section (Safari / iOS & Android Camera Integration) */}
          <div>
            <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-2">
              1. Kıyafet Fotoğrafı Çek veya Yükle
            </label>

            {/* In-App Live Camera Stream (Safari iOS WebRTC compatible) */}
            {isLiveCameraActive ? (
              <div className="relative rounded-3xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-[#1C1917]">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Camera Overlay Controls */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={() => {
                      const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
                      setCameraFacingMode(nextFacing);
                      startLiveCamera(nextFacing);
                    }}
                    className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition"
                    title="Kamerayı Çevir"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-20">
                  <button
                    type="button"
                    onClick={captureLivePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-[#1C1917] flex items-center justify-center shadow-2xl active:scale-95 transition"
                    title="Fotoğrafı Çek"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1C1917]" />
                  </button>
                </div>
              </div>
            ) : !photoDataUrl ? (
              /* Upload & Camera Trigger Zone */
              <div className="space-y-3">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processSelectedFile(file);
                  }}
                  className="border-2 border-dashed border-[#D5C9BE] hover:border-[#8C7A6B] bg-[#F7F4EE] rounded-3xl p-6 text-center transition flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-[#EAE2D5] flex items-center justify-center text-[#5C5248]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#292524]">
                      Fotoğrafı buraya bırakın veya seçenekleri kullanın
                    </p>
                    <p className="text-xs text-[#8C7A6B] mt-0.5">
                      Yatakta, askıda veya yerde çekilen fotoğrafların arka planı temizlenir.
                    </p>
                  </div>

                  {/* Camera & Gallery Buttons (Native Safari iOS Direct Label Triggers) */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    {/* Native Apple / Mobile Camera via Direct Label */}
                    <label
                      htmlFor="safari-camera-input"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C1917] text-[#FAF8F5] hover:bg-[#38332E] transition shadow-xs active:scale-98"
                    >
                      <Camera className="w-4 h-4 text-[#E6DEC8]" />
                      <span>Kamerayı Aç</span>
                    </label>

                    {/* Direct Live Stream Camera Option */}
                    <button
                      type="button"
                      onClick={() => startLiveCamera('environment')}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#F5EFEB] text-[#44403C] border border-[#D5C9BE] hover:bg-[#EAE2D5] transition"
                      title="Canlı kamera vizörü"
                    >
                      <Video className="w-4 h-4 text-[#8C7A6B]" />
                      <span>Canlı Vizör</span>
                    </button>

                    {/* Gallery Picker via Direct Label */}
                    <label
                      htmlFor="safari-gallery-input"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-[#292524] border border-[#D5C9BE] hover:bg-[#F3EDE6] transition"
                    >
                      <ImageIcon className="w-4 h-4 text-[#8C7A6B]" />
                      <span>Galeriden Seç</span>
                    </label>
                  </div>

                  {/* Hidden Inputs linked via HTML ID for 100% Safari iOS reliability */}
                  <input
                    id="safari-gallery-input"
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processSelectedFile(file);
                    }}
                  />
                  <input
                    id="safari-camera-input"
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processSelectedFile(file);
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Photo Preview with Background Removal Controls */
              <div className="rounded-2xl border border-[#E7E0D8] bg-[#F7F4EE] p-4 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative w-36 h-44 rounded-xl overflow-hidden bg-radial from-stone-50 to-stone-200 border border-[#E7E0D8] shrink-0 shadow-sm flex items-center justify-center p-2">
                  <img
                    src={photoDataUrl}
                    alt="Kıyafet Ön İzleme"
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                  {isRemovingBg && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2 text-center">
                      <Loader2 className="w-5 h-5 animate-spin mb-1 text-[#E6DEC8]" />
                      <span className="text-[10px] font-semibold">Arka plan temizleniyor...</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5C5248]">
                      Fotoğraf Hazır
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoDataUrl(null);
                        setRawOriginalUrl(null);
                      }}
                      className="text-xs text-rose-700 hover:text-rose-900 underline font-medium"
                    >
                      Fotoğrafı Değiştir
                    </button>
                  </div>

                  {/* Background Toggle Button */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleBg}
                      disabled={isRemovingBg}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        isBgRemoved
                          ? 'bg-[#1C1917] text-[#FAF8F5] border-[#1C1917]'
                          : 'bg-white text-[#5C5248] border-[#D5C9BE] hover:bg-[#F3EDE6]'
                      }`}
                      title="Yatak, yer veya askı arka planını temizle"
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${isBgRemoved ? 'text-[#E6DEC8]' : 'text-[#8C7A6B]'}`} />
                      <span>{isBgRemoved ? 'Stüdyo Görünümü (Aktif)' : 'Arka Planı Temizle'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => runAiAnalysis()}
                      disabled={isAnalyzing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4A5320] border border-[#C5CEB0] hover:bg-[#F4F6EE] transition"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4A5320]" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#4A5320]" />
                      )}
                      <span>Yeniden Analiz Et</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-[#8C7A6B] block">
                    {isBgRemoved ? '✦ Temiz stüdyo zeminine uyarlandı.' : '✦ Orijinal çekim.'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Simplified Fashion Details Form (No brand, size, price, date) */}
          <form id="add-clothing-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="border-t border-[#E7E0D8] pt-4">
              <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                Kıyafet Adı *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ör. Ekru Kaşmir Triko Kazak"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-sm text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden focus:border-[#1C1917]"
              />
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Ana Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value as CategoryType;
                    setCategory(newCat);
                    if (!subcategory || subcategory === CATEGORY_LABELS[category]) {
                      setSubcategory(CATEGORY_LABELS[newCat]);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-xs font-medium text-[#1C1917] focus:outline-hidden"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Alt Kategori / Tür
                </label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="ör. Kazak, Kot Pantolon, Sneaker"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C9BE] text-xs text-[#1C1917] placeholder-[#9C8F83] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Colors & Pattern */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Ana Renk *
                </label>
                <input
                  type="text"
                  required
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="ör. Siyah, Ekru, Bej"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs text-[#1C1917] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  İkincil Renk (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="ör. Beyaz çizgiler"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs text-[#1C1917] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Desen
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="ör. Düz, Çizgili, Ekose"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs text-[#1C1917] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Season, Style & Occasion */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Mevsim
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value as SeasonType)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs font-medium text-[#1C1917] focus:outline-hidden"
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Tarz / Stil
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as StyleType)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs font-medium text-[#1C1917] focus:outline-hidden"
                >
                  {STYLES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                  Kullanım Ortamı
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value as OccasionType)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5C9BE] text-xs font-medium text-[#1C1917] focus:outline-hidden"
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional AI Pairing Recommendation Note */}
            {pairingTip && (
              <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#E7E0D8] text-xs text-[#5C5248]">
                <span className="font-semibold text-[#1C1917]">✦ Stilist Önerisi: </span>
                {pairingTip}
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E7E0D8] bg-[#F5EFEB]/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              handleResetForm();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#786C60] hover:bg-[#EAE2D5] transition"
          >
            Vazgeç
          </button>

          <button
            type="submit"
            form="add-clothing-form"
            disabled={isSaving || !photoDataUrl}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-md ${
              isSaving || !photoDataUrl
                ? 'bg-[#C5B8AC] text-white cursor-not-allowed'
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
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Dolaba Kaydet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
