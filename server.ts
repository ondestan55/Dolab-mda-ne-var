import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with 25mb limit for clothing photos
app.use(express.json({ limit: '25mb' }));

// Shared Gemini AI client with telemetry User-Agent
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health / Status check
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// Analyze Clothing Item with Gemini 3.8 Flash Vision
app.post('/api/analyze-clothing', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API anahtarı yapılandırılmamış.',
        hasGeminiKey: false,
      });
    }

    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Görsel verisi bulunamadı.' });
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const prompt = `Sen kıdemli bir moda uzmanı ve dijital gardırop küratörüsün.
Fotoğraftaki kıyafeti analiz et ve aşağıdaki kurallara göre yapılandırılmış Türkçe JSON çıktısı ver:
1. "name": Kıyafetin şık ve açıklayıcı adı (örnek: "Ekru Kaşmir Triko Kazak", "Koyu Mavi Düz Kesim Jean").
2. "category": Yalnızca şu değerlerden biri olmalıdır: "top", "bottom", "outerwear", "dress", "shoes", "bag", "accessory", "activewear", "other".
   - top: Tişört, gömlek, kazak, sweatshirt, bluz
   - bottom: Pantolon, kot, şort, etek
   - outerwear: Ceket, mont, kaban, trençkot, hırka, blazer
   - dress: Elbise, tulum
   - shoes: Spor ayakkabı, klasik ayakkabı, bot, çizme, sandalet
   - bag: Omuz çantası, sırt çantası, el çantası
   - accessory: Kemer, atkı, şapka, takı, kravat
   - activewear: Tayt, spor tişörtü, spor sütyeni
   - other: Diğer
3. "subcategory": Kıyafetin alt türü (örnek: "Tişört", "Kazak", "Kot Pantolon", "Blazer Ceket", "Sneaker").
4. "primaryColor": Ana renk (örnek: "Siyah", "Beyaz", "Krem", "Bej", "Lacivert", "Gri", "Haki", "Kahverengi", "Bordo", "Mavi").
5. "secondaryColor": İkincil renk veya detay rengi varsa (yoksa boş string).
6. "pattern": Desen türü (örnek: "Düz", "Çizgili", "Ekose", "Çiçekli", "Baskılı", "Geometrik", "Benekli").
7. "fabric": Görselden kesin olarak tahmin edilebiliyorsa kumaş türü (örnek: "Pamuklu", "Denim", "Keten", "Yünlü", "Deri", "Görselden kesin olarak belirlenemiyor").
8. "style": "Günlük", "Casual", "Smart Casual", "Klasik", "Spor", "Sokak Modası", "Minimalist", "Şık".
9. "season": "İlkbahar", "Yaz", "Sonbahar", "Kış", "Dört Mevsim".
10. "occasion": "İş", "Günlük Hayat", "Sosyal Etkinlik", "Spor", "Özel Gün", "Seyahat".
11. "pairingSuggestions": Bu parçanın hangi renk veya kıyafet türleriyle harika uyum sağlayacağına dair 1-2 cümlelik tavsiye.
12. "confidence": 0.0 ile 1.0 arasında analiz güven skoru.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            subcategory: { type: Type.STRING },
            primaryColor: { type: Type.STRING },
            secondaryColor: { type: Type.STRING },
            pattern: { type: Type.STRING },
            fabric: { type: Type.STRING },
            style: { type: Type.STRING },
            season: { type: Type.STRING },
            occasion: { type: Type.STRING },
            pairingSuggestions: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: [
            'name',
            'category',
            'subcategory',
            'primaryColor',
            'pattern',
            'style',
            'season',
            'occasion',
            'confidence',
          ],
        },
      },
    });

    const textOutput = response.text || '{}';
    const analysis = JSON.parse(textOutput);
    return res.json({ success: true, data: analysis });
  } catch (err: any) {
    console.error('Gemini analyze-clothing error:', err);
    return res.status(500).json({
      error: 'Kıyafet analizi sırasında bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'),
    });
  }
});

// Generate Outfits strictly from User's Actual Wardrobe Items
app.post('/api/generate-outfits', async (req: Request, res: Response) => {
  try {
    const { items, preferences } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Kombin oluşturmak için gardıropta en az birkaç parça bulunmalıdır.',
      });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API anahtarı yapılandırılmamış. Yerel kombin algoritması devreye alınıyor.',
        hasGeminiKey: false,
      });
    }

    // Prepare simplified items data for prompt token efficiency
    const wardrobeCatalog = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      primaryColor: item.primaryColor,
      style: item.style,
      season: item.season,
      occasion: item.occasion,
      isFavorite: Boolean(item.isFavorite),
      wearCount: item.wearCount || 0,
    }));

    const prompt = `Sen lüks bir moda stilisti ve gardırop küratörüsün.
Aşağıda kullanıcının DİJİTAL GARDIROBUNA AİT GERÇEK KIYAFETLER listelenmiştir:
${JSON.stringify(wardrobeCatalog, null, 2)}

Kullanıcının Tercihleri ve Koşulları:
- Kullanım Ortamı / Etkinlik: ${preferences?.occasion || 'Günlük'}
- İstenen Stil: ${preferences?.style || 'Belirtilmemiş'}
- Mevsim: ${preferences?.season || 'Dört Mevsim'}
- Hava Koşulu: ${preferences?.weather || 'Ilık'}
- Sıcaklık: ${preferences?.temperature ? preferences.temperature + '°C' : 'Ortalama'}
- Renk Tercihi: ${preferences?.colorPreference || 'Uyumlu renkler'}
- Favori Parçaları Önceliklendir: ${preferences?.includeFavorites ? 'Evet' : 'Fark etmez'}
- Özel Not: ${preferences?.customPrompt || 'Yok'}

KURALLAR (ÇOK ÖNEMLİ):
1. Yalnızca ve sadece yukarıdaki gardıropta bulunan kıyafetlerin "id" değerlerini kullan. Asla listede olmayan bir eşya uydurma.
2. 2 ile 3 adet farklı ve eksiksiz kombin alternatifleri oluştur.
3. Her kombin en azından bir Üst Giyim (top) ve Alt Giyim (bottom) VEYA bir Elbise/Tulum (dress) içermeli; mümkünse ayakkabı (shoes), dış giyim (outerwear) veya aksesuar/çanta ile tamamlanmalıdır.
4. Parçaların renk uyumu, mevsim koşulu ve kullanım ortamı mükemmel dengelenmelidir.
5. Her kombin için estetik bir isim ("Modern Monokrom Şıklık", "Zahmetsiz Hafta Sonu Casual" vb.), stil gerekçesi, renk uyumu analizi ve stil ipucu ver.
6. Eğer gardıropta tam bir kombin için temel parça eksikse (örn. hiç ayakkabı veya hiç alt giyim yoksa) "missingCategories" alanında bunu Türkçe belirt.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outfits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  itemIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  style: { type: Type.STRING },
                  occasion: { type: Type.STRING },
                  description: { type: Type.STRING },
                  colorHarmonyReasoning: { type: Type.STRING },
                  weatherSuitability: { type: Type.STRING },
                  stylingTips: { type: Type.STRING },
                },
                required: ['name', 'itemIds', 'style', 'occasion', 'description'],
              },
            },
            generalAdvice: { type: Type.STRING },
            missingCategories: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['outfits'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Gemini generate-outfits error:', err);
    return res.status(500).json({
      error: 'Kombin oluşturma sırasında hata oluştu: ' + (err.message || 'Bilinmeyen hata'),
    });
  }
});

// Live Weather lookup with automatic GPS, reverse geocoding, and Open-Meteo
app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    let lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    let lon = req.query.lon ? parseFloat(req.query.lon as string) : null;
    let cityName = (req.query.city as string) || '';
    const isAuto = req.query.auto === 'true' || (!cityName && !lat && !lon);

    // 1. If auto mode and no coordinates, try IP Geolocation first
    if (isAuto && (!lat || !lon)) {
      try {
        const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || '';
        const ipUrl = clientIp && !clientIp.startsWith('127.') && !clientIp.startsWith('10.') && !clientIp.startsWith('192.168.')
          ? `https://ipwho.is/${clientIp}`
          : `https://ipwho.is/`;
        const ipRes = await fetch(ipUrl);
        const ipData = await ipRes.json();

        if (ipData && ipData.success !== false && ipData.latitude && ipData.longitude) {
          lat = ipData.latitude;
          lon = ipData.longitude;
          cityName = ipData.city ? `${ipData.city}, ${ipData.country || ''}` : `${ipData.country || 'Konumunuz'}`;
        }
      } catch (e) {
        console.warn('IP location fetch failed:', e);
      }
    }

    // 2. If coordinates are provided (from browser GPS or IP), reverse geocode city name if needed
    if (lat !== null && lon !== null) {
      if (!cityName) {
        try {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=tr`;
          const revRes = await fetch(revUrl, {
            headers: { 'User-Agent': 'DolabimdaNeVarAI/1.0' },
          });
          if (revRes.ok) {
            const revData = await revRes.json();
            const addr = revData.address;
            cityName =
              addr?.city ||
              addr?.town ||
              addr?.province ||
              addr?.county ||
              addr?.state ||
              addr?.country ||
              'Mevcut Konumunuz';
            if (addr?.country && !cityName.includes(addr.country)) {
              cityName = `${cityName}, ${addr.country}`;
            }
          }
        } catch (e) {
          console.warn('Reverse geocoding error:', e);
          cityName = 'Mevcut Konumunuz';
        }
      }
    } else {
      // 3. Manual city name geocoding fallback
      const targetCity = cityName || 'İstanbul';
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(targetCity)}&count=1&language=tr&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        return res.json({
          city: targetCity,
          temperature: 19,
          condition: 'Parçalı Bulutlu',
          conditionCategory: 'Ilık',
          isEstimated: true,
          isAutoDetected: false,
        });
      }

      lat = geoData.results[0].latitude;
      lon = geoData.results[0].longitude;
      cityName = `${geoData.results[0].name}, ${geoData.results[0].country || ''}`;
    }

    // 4. Fetch real-time weather from Open-Meteo using resolved coordinates
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();
    const current = weatherData.current;

    // Map WMO codes to Turkish descriptions & clothing category
    const code = current?.weather_code ?? 0;
    let condition = 'Açık Güneşli';
    let conditionCategory: 'Sıcak' | 'Ilık' | 'Serin' | 'Soğuk' | 'Yağmurlu' | 'Rüzgarlı' = 'Ilık';

    if (code === 0) {
      condition = 'Açık Güneşli';
    } else if (code <= 3) {
      condition = 'Parçalı Bulutlu';
    } else if (code <= 48) {
      condition = 'Sisli ve Puslu';
      conditionCategory = 'Serin';
    } else if (code <= 67) {
      condition = 'Yağmurlu';
      conditionCategory = 'Yağmurlu';
    } else if (code <= 77) {
      condition = 'Karlı';
      conditionCategory = 'Soğuk';
    } else if (code <= 82) {
      condition = 'Sağanak Yağışlı';
      conditionCategory = 'Yağmurlu';
    } else {
      condition = 'Fırtınalı';
      conditionCategory = 'Rüzgarlı';
    }

    const temp = Math.round(current?.temperature_2m ?? 20);
    if (temp >= 26) conditionCategory = 'Sıcak';
    else if (temp >= 18 && conditionCategory !== 'Yağmurlu') conditionCategory = 'Ilık';
    else if (temp >= 10 && conditionCategory !== 'Yağmurlu') conditionCategory = 'Serin';
    else if (temp < 10) conditionCategory = 'Soğuk';

    return res.json({
      city: cityName || 'Mevcut Konumunuz',
      latitude: lat,
      longitude: lon,
      temperature: temp,
      apparentTemperature: Math.round(current?.apparent_temperature ?? temp),
      windSpeed: current?.wind_speed_10m ?? 0,
      condition,
      conditionCategory,
      isEstimated: false,
      isAutoDetected: isAuto,
    });
  } catch (err) {
    console.error('Weather error:', err);
    return res.json({
      city: req.query.city || 'Mevcut Konum',
      temperature: 19,
      condition: 'Parçalı Bulutlu',
      conditionCategory: 'Ilık',
      isEstimated: true,
      isAutoDetected: false,
    });
  }
});

// Start Express server and mount Vite middleware
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
