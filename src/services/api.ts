import {
  ClothingItem,
  ClothingAnalysisResult,
  WeatherInfo,
  Outfit,
} from '../types/wardrobe';
import { generateLocalOutfits, GenerationParams } from '../utils/localOutfitEngine';

export interface ServerStatus {
  ok: boolean;
  hasGeminiKey: boolean;
}

export async function checkServerStatus(): Promise<ServerStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) return { ok: false, hasGeminiKey: false };
    const data = await res.json();
    return { ok: true, hasGeminiKey: Boolean(data.hasGeminiKey) };
  } catch {
    return { ok: false, hasGeminiKey: false };
  }
}

export async function analyzeClothingPhoto(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ClothingAnalysisResult> {
  const res = await fetch('/api/analyze-clothing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Fotoğraf analiz edilemedi.');
  }

  return data.data;
}

export interface OutfitGenerationResponse {
  outfits: Outfit[];
  generalAdvice?: string;
  missingCategories?: string[];
  isAiPowered: boolean;
  message?: string;
}

export async function generateWardrobeOutfits(
  items: ClothingItem[],
  preferences: GenerationParams
): Promise<OutfitGenerationResponse> {
  // Try real Gemini AI server route first
  try {
    const res = await fetch('/api/generate-outfits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, preferences }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.outfits)) {
        // Ensure proper IDs and timestamps
        const mappedOutfits: Outfit[] = data.data.outfits.map((o: any, idx: number) => ({
          id: 'ai_outfit_' + Date.now() + '_' + idx,
          name: o.name || 'Özel Kombin ' + (idx + 1),
          itemIds: o.itemIds || [],
          createdAt: Date.now(),
          style: o.style || preferences.style || 'Şık',
          occasion: o.occasion || preferences.occasion || 'Günlük Hayat',
          season: preferences.season || 'Dört Mevsim',
          description: o.description || '',
          colorHarmonyReasoning: o.colorHarmonyReasoning || '',
          weatherSuitability: o.weatherSuitability || '',
          stylingTips: o.stylingTips || '',
          isFavorite: false,
          wearCount: 0,
        }));

        return {
          outfits: mappedOutfits,
          generalAdvice: data.data.generalAdvice,
          missingCategories: data.data.missingCategories || [],
          isAiPowered: true,
        };
      }
    }
  } catch (err) {
    console.warn('Gemini server route unavailable, engaging local fashion engine:', err);
  }

  // Graceful fallback to smart local pairing engine
  const localResult = generateLocalOutfits(items, preferences);
  return {
    outfits: localResult.outfits,
    generalAdvice: localResult.generalAdvice,
    missingCategories: localResult.missingCategories,
    isAiPowered: false,
    message: 'Yerel stil eşleştirme motoru ile hazırlandı (AI bağlantısı çevrimdışı veya yapılandırılmamış).',
  };
}

export async function fetchLiveWeather(cityName: string = 'İstanbul'): Promise<WeatherInfo> {
  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Weather fetch error:', err);
  }

  // Default fallback
  return {
    city: cityName,
    temperature: 20,
    apparentTemperature: 20,
    condition: 'Parçalı Bulutlu',
    conditionCategory: 'Ilık',
    windSpeed: 12,
    isEstimated: true,
  };
}
