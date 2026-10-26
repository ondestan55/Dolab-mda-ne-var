import {
  ClothingItem,
  ClothingAnalysisResult,
  WeatherInfo,
  Outfit,
  AuthUser,
  AdminUserItem,
  AdminVerificationItem,
  AdminSmtpSettings,
} from '../types/wardrobe';
import { generateLocalOutfits, GenerationParams } from '../utils/localOutfitEngine';
import { extractClothingAttributesFromImage } from '../utils/imageUtils';

export interface ServerStatus {
  ok: boolean;
  hasGeminiKey: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  email?: string;
  user?: AuthUser;
  token?: string;
  requiresVerification?: boolean;
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: 'Sunucuya bağlanılamadı: ' + err.message };
  }
}

export async function verifyEmailCode(email: string, code: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: 'Sunucuya bağlanılamadı: ' + err.message };
  }
}

export async function resendEmailCode(email: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: 'Sunucuya bağlanılamadı: ' + err.message };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: 'Sunucuya bağlanılamadı: ' + err.message };
  }
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
    // Allow up to 20 seconds for Gemini 3.8 multimodal analysis to return complete, accurate result
    const timeoutId = setTimeout(() => controller.abort(), 20000);

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

// ----------------------------------------------------
// ADMIN API CLIENT METHODS
// ----------------------------------------------------

export async function fetchAdminUsers(): Promise<{ success: boolean; users: AdminUserItem[] }> {
  try {
    const res = await fetch('/api/admin/users');
    return await res.json();
  } catch (err) {
    return { success: false, users: [] };
  }
}

export async function fetchAdminVerifications(): Promise<{ success: boolean; verifications: AdminVerificationItem[] }> {
  try {
    const res = await fetch('/api/admin/verifications');
    return await res.json();
  } catch (err) {
    return { success: false, verifications: [] };
  }
}

export async function approveUserManually(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/approve-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAdminSmtp(): Promise<{ success: boolean; smtp: AdminSmtpSettings }> {
  try {
    const res = await fetch('/api/admin/smtp');
    return await res.json();
  } catch (err) {
    return {
      success: false,
      smtp: {
        host: '',
        port: 465,
        secure: true,
        user: '',
        isConfigured: false,
        from: '',
      },
    };
  }
}

export async function saveAdminSmtp(config: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  from?: string;
}): Promise<{ success: boolean; message?: string; warning?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendAdminTestEmail(email?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/send-test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

