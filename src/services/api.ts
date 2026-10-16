import {
  ClothingItem,
  ClothingAnalysisResult,
  WeatherInfo,
  Outfit,
} from '../types/wardrobe';
import { generateLocalOutfits, GenerationParams } from '../utils/localOutfitEngine';
import { extractClothingAttributesFromImage } from '../utils/imageUtils';

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
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('/api/analyze-clothing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (netErr) {
    console.warn('Backend clothing analysis unavailable or timed out, running instant vision engine:', netErr);
  }

  // Guaranteed fallback: extracts color, garment silhouette, pattern and style client-side
  return extractClothingAttributesFromImage(imageBase64);
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

export async function getDeviceCoordinates(): Promise<{ lat: number; lon: number } | null> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn('Geolocation permission not granted or unavailable, falling back to IP detection:', err.message);
        resolve(null);
      },
      { timeout: 6000, maximumAge: 300000 }
    );
  });
}

export async function fetchLiveWeather(
  cityName?: string,
  forceAuto: boolean = false
): Promise<WeatherInfo> {
  try {
    // 1. If automatic mode or no city provided, check device GPS first
    if (forceAuto || !cityName) {
      const coords = await getDeviceCoordinates();
      if (coords) {
        const res = await fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}&auto=true`);
        if (res.ok) {
          return await res.json();
        }
      }

      // If no GPS, call server auto IP detection
      const autoRes = await fetch('/api/weather?auto=true');
      if (autoRes.ok) {
        return await autoRes.json();
      }
    }

    // 2. Query specific city
    const targetCity = cityName || 'İstanbul';
    const res = await fetch(`/api/weather?city=${encodeURIComponent(targetCity)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Weather fetch error:', err);
  }

  // Default graceful fallback
  return {
    city: cityName || 'Konumunuz',
    temperature: 20,
    apparentTemperature: 20,
    condition: 'Parçalı Bulutlu',
    conditionCategory: 'Ilık',
    windSpeed: 12,
    isEstimated: true,
    isAutoDetected: forceAuto,
  };
}
