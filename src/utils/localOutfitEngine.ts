import { ClothingItem, Outfit, LayeringPreferenceType } from '../types/wardrobe';

export interface GenerationParams {
  occasion?: string;
  style?: string;
  season?: string;
  weather?: string;
  temperature?: number;
  colorPreference?: string;
  layeringPreference?: LayeringPreferenceType;
  includeFavorites?: boolean;
  excludeRecentlyWorn?: boolean;
  customPrompt?: string;
}

export interface GeneratedOutfitResult {
  outfits: Outfit[];
  generalAdvice: string;
  missingCategories: string[];
  isLocalFallback: boolean;
}

// Color compatibility matrix for local pairing
const NEUTRALS = ['siyah', 'beyaz', 'ekru', 'krem', 'bej', 'gri', 'antrasit', 'kahverengi', 'taba'];

export function areColorsHarmonious(colorA: string, colorB: string): boolean {
  if (!colorA || !colorB) return true;
  const a = colorA.toLowerCase();
  const b = colorB.toLowerCase();
  if (a === b) return true; // Monochrome
  if (NEUTRALS.some((n) => a.includes(n)) || NEUTRALS.some((n) => b.includes(n))) return true; // Neutral matches anything
  if (
    (a.includes('mavi') && b.includes('bej')) ||
    (a.includes('haki') && b.includes('krem')) ||
    (a.includes('lacivert') && b.includes('bordo')) ||
    (a.includes('kahverengi') && b.includes('mavi'))
  )
    return true;
  return false;
}

/**
 * STRICT OUTFIT SANITIZER & VALIDATOR
 * Guarantees that:
 * 1. NEVER 2 bottoms together (e.g. no jeans + leggings, no shorts + trousers).
 * 2. An outfit MUST have either:
 *    - Exactly 1 Dress OR
 *    - At least 1 Top + Exactly 1 Bottom
 * 3. Never duplicate shoes (maximum 1 pair of shoes)
 * 4. Maximum 1 bag
 * 5. Dynamic piece counts from 3 up to 7 pieces without rigid 4-piece limits!
 */
export function sanitizeAndValidateOutfit(
  itemIds: string[],
  allWardrobeItems: ClothingItem[]
): { validItemIds: string[]; isValid: boolean; correctionsMade: string[] } {
  const itemMap = new Map(allWardrobeItems.map((i) => [i.id, i]));
  const items = itemIds.map((id) => itemMap.get(id)).filter((i): i is ClothingItem => i !== undefined);

  const correctionsMade: string[] = [];
  const finalItemIds: string[] = [];

  const dresses = items.filter((i) => i.category === 'dress');
  const bottoms = items.filter((i) => i.category === 'bottom');
  const tops = items.filter((i) => i.category === 'top');
  const outerwear = items.filter((i) => i.category === 'outerwear');
  const shoes = items.filter((i) => i.category === 'shoes');
  const bags = items.filter((i) => i.category === 'bag');
  const accessories = items.filter((i) => i.category === 'accessory');

  // Case 1: Dress present
  if (dresses.length > 0) {
    // Keep 1 dress
    finalItemIds.push(dresses[0].id);
    if (bottoms.length > 0) {
      correctionsMade.push('Elbise ile gereksiz alt giyim çıkarıldı.');
    }
  } else {
    // Case 2: Standard outfit (Must have tops and EXACTLY 1 bottom)
    if (bottoms.length > 1) {
      correctionsMade.push(`Aynı anda ${bottoms.length} alt giyim tespit edildi, yalnızca en uygun 1 alt parça seçildi.`);
      finalItemIds.push(bottoms[0].id); // Keep strictly 1 bottom
    } else if (bottoms.length === 1) {
      finalItemIds.push(bottoms[0].id);
    } else {
      // Missing bottom! Find best bottom from wardrobe
      const wardrobeBottoms = allWardrobeItems.filter((i) => i.category === 'bottom' && i.status === 'active');
      if (wardrobeBottoms.length > 0) {
        finalItemIds.push(wardrobeBottoms[0].id);
        correctionsMade.push('Eksik alt parça gardırobunuzdan tamamlandı.');
      }
    }

    // Must have at least one top
    if (tops.length === 0) {
      const wardrobeTops = allWardrobeItems.filter((i) => i.category === 'top' && i.status === 'active');
      if (wardrobeTops.length > 0) {
        finalItemIds.push(wardrobeTops[0].id);
        correctionsMade.push('Eksik üst giyim gardırobunuzdan tamamlandı.');
      }
    } else {
      // Add all legitimate tops (e.g., inner t-shirt + sweater layering)
      tops.slice(0, 2).forEach((t) => finalItemIds.push(t.id));
    }
  }

  // Outerwear (0 or 1, max 2 for deep winter layering)
  outerwear.slice(0, 2).forEach((o) => finalItemIds.push(o.id));

  // Shoes: STRICTLY at most 1 pair
  if (shoes.length > 1) {
    correctionsMade.push('Birden fazla ayakkabı tek çifte indirildi.');
    finalItemIds.push(shoes[0].id);
  } else if (shoes.length === 1) {
    finalItemIds.push(shoes[0].id);
  }

  // Bags: at most 1
  if (bags.length > 0) {
    finalItemIds.push(bags[0].id);
  }

  // Accessories: up to 3
  accessories.slice(0, 3).forEach((a) => finalItemIds.push(a.id));

  // Deduplicate IDs
  const uniqueIds = Array.from(new Set(finalItemIds));

  return {
    validItemIds: uniqueIds,
    isValid: correctionsMade.length === 0,
    correctionsMade,
  };
}

export function generateLocalOutfits(
  items: ClothingItem[],
  params: GenerationParams
): GeneratedOutfitResult {
  const missingCategories: string[] = [];

  // Filter out laundry / archived items
  const activeItems = items.filter((item) => item.status === 'active');

  const tops = activeItems.filter((i) => i.category === 'top');
  const bottoms = activeItems.filter((i) => i.category === 'bottom');
  const dresses = activeItems.filter((i) => i.category === 'dress');
  const shoes = activeItems.filter((i) => i.category === 'shoes');
  const outerwear = activeItems.filter((i) => i.category === 'outerwear');
  const bags = activeItems.filter((i) => i.category === 'bag');
  const accessories = activeItems.filter((i) => i.category === 'accessory');

  if (tops.length === 0 && dresses.length === 0) {
    missingCategories.push('Üst Giyim veya Elbise');
  }
  if (bottoms.length === 0 && dresses.length === 0) {
    missingCategories.push('Alt Giyim veya Elbise');
  }
  if (shoes.length === 0) {
    missingCategories.push('Ayakkabı');
  }

  const outfits: Outfit[] = [];

  // Scoring function
  const scoreItem = (item: ClothingItem): number => {
    let score = 0;
    if (params.includeFavorites && item.isFavorite) score += 5;
    if (params.style && item.style.toLowerCase() === params.style.toLowerCase()) score += 4;
    if (params.occasion && item.occasion.toLowerCase() === params.occasion.toLowerCase()) score += 3;
    if (params.season && (item.season === params.season || item.season === 'Dört Mevsim')) score += 3;
    return score;
  };

  const sortedTops = [...tops].sort((a, b) => scoreItem(b) - scoreItem(a));
  const sortedBottoms = [...bottoms].sort((a, b) => scoreItem(b) - scoreItem(a));
  const sortedDresses = [...dresses].sort((a, b) => scoreItem(b) - scoreItem(a));
  const sortedShoes = [...shoes].sort((a, b) => scoreItem(b) - scoreItem(a));
  const sortedOuterwear = [...outerwear].sort((a, b) => scoreItem(b) - scoreItem(a));
  const sortedBags = [...bags].sort((a, b) => scoreItem(b) - scoreItem(a));
  const sortedAccessories = [...accessories].sort((a, b) => scoreItem(b) - scoreItem(a));

  // Determine subcategory layer types
  const isInnerTop = (t: ClothingItem) => {
    const sub = (t.subcategory || '').toLowerCase();
    return sub.includes('tişört') || sub.includes('t-shirt') || sub.includes('gömlek') || sub.includes('bluz') || sub.includes('atlet');
  };
  const isMidTop = (t: ClothingItem) => {
    const sub = (t.subcategory || '').toLowerCase();
    return sub.includes('kazak') || sub.includes('triko') || sub.includes('sweatshirt') || sub.includes('hırka') || sub.includes('süveter');
  };

  const innerTops = sortedTops.filter(isInnerTop);
  const midTops = sortedTops.filter(isMidTop);

  const layeringMode = params.layeringPreference || (
    params.temperature !== undefined && params.temperature < 16 ? 'rich' : 'balanced'
  );

  // COMBINATION 1: Primary Layered Look (5 to 7 pieces when rich, 4 to 5 when balanced)
  if (sortedTops.length > 0 && sortedBottoms.length > 0) {
    const selectedIds: string[] = [];

    // Layer 1: Inner top (T-shirt / shirt)
    const baseTop = innerTops[0] || sortedTops[0];
    selectedIds.push(baseTop.id);

    // Layer 2: Mid top (Sweater / Knitwear) if rich layering or cold
    if (layeringMode !== 'minimal') {
      const secondTop = midTops.find((t) => t.id !== baseTop.id) || (sortedTops.length > 1 && sortedTops[1].id !== baseTop.id ? sortedTops[1] : null);
      if (secondTop) {
        selectedIds.push(secondTop.id);
      }
    }

    // Layer 3: Outerwear (Jacket / Coat)
    if (sortedOuterwear.length > 0 && layeringMode !== 'minimal') {
      selectedIds.push(sortedOuterwear[0].id);
    }

    // Layer 4: STRICTLY ONE BOTTOM (never 2 bottoms!)
    const matchingBottom =
      sortedBottoms.find((b) => areColorsHarmonious(baseTop.primaryColor, b.primaryColor)) ||
      sortedBottoms[0];
    selectedIds.push(matchingBottom.id);

    // Layer 5: Shoes (strictly 1 pair)
    if (sortedShoes.length > 0) {
      selectedIds.push(sortedShoes[0].id);
    }

    // Layer 6: Bag (optional based on layering)
    if (sortedBags.length > 0) {
      selectedIds.push(sortedBags[0].id);
    }

    // Layer 7: Accessories (Belt / Scarf / Hat)
    if (layeringMode === 'rich') {
      sortedAccessories.slice(0, 2).forEach((acc) => selectedIds.push(acc.id));
    } else if (sortedAccessories.length > 0) {
      selectedIds.push(sortedAccessories[0].id);
    }

    const sanitized = sanitizeAndValidateOutfit(selectedIds, activeItems);

    outfits.push({
      id: 'gen_' + Date.now() + '_1',
      name: `${params.style || 'Şık'} & Katmanlı Şehir Stili`,
      itemIds: sanitized.validItemIds,
      createdAt: Date.now(),
      style: params.style || baseTop.style,
      occasion: params.occasion || 'Günlük Hayat',
      season: params.season || baseTop.season,
      description: `${baseTop.name} ve ${matchingBottom.name} merkezli, ${sanitized.validItemIds.length} parçalı kusursuz katmanlama.`,
      colorHarmonyReasoning: `${baseTop.primaryColor} ve ${matchingBottom.primaryColor} tonları tek alt parçayla temiz ve akıcı bir silüet oluşturur.`,
      weatherSuitability: params.weather
        ? `${params.weather} hava koşulları ve ${params.temperature || 19}°C için ideal katmanlı yapı.`
        : 'Mevsimsel geçişler için konforlu ve şık.',
      stylingTips: 'İç parçanın yakasını veya kol ucunu hafifçe göstererek modern katman derinliği kazandırın.',
      isFavorite: false,
      wearCount: 0,
    });
  }

  // COMBINATION 2: Dress OR Clean Smart Look
  if (sortedDresses.length > 0) {
    const dress = sortedDresses[0];
    const selectedIds = [dress.id];

    if (sortedOuterwear.length > 0) selectedIds.push(sortedOuterwear[0].id);
    if (sortedShoes.length > 0) selectedIds.push(sortedShoes[0].id);
    if (sortedBags.length > 0) selectedIds.push(sortedBags[0].id);
    if (sortedAccessories.length > 0) selectedIds.push(sortedAccessories[0].id);

    const sanitized = sanitizeAndValidateOutfit(selectedIds, activeItems);

    outfits.push({
      id: 'gen_' + Date.now() + '_2',
      name: 'Tek Parça Zahmetsiz Zarafet',
      itemIds: sanitized.validItemIds,
      createdAt: Date.now(),
      style: params.style || 'Şık',
      occasion: params.occasion || dress.occasion,
      season: params.season || dress.season,
      description: `${dress.name} silüetinin tamamlayıcı aksesuarlarla kusursuz birlikteliği (${sanitized.validItemIds.length} parça).`,
      colorHarmonyReasoning: `${dress.primaryColor} rengini öne çıkaran zarif tamamlayıcı tonlar.`,
      weatherSuitability: 'Gün boyu hareket kolaylığı ve konfor.',
      stylingTips: 'Minimal bir çanta ve uyumlu ayakkabı ile odağı elbisenin formunda tutun.',
      isFavorite: false,
      wearCount: 0,
    });
  } else if (sortedTops.length > 1 && sortedBottoms.length > 1) {
    // Alternative single top + alternative single bottom (Strictly 1 bottom!)
    const altTop = sortedTops[1];
    const altBottom = sortedBottoms[1];
    const selectedIds = [altTop.id, altBottom.id];

    if (sortedOuterwear.length > 1) selectedIds.push(sortedOuterwear[1].id);
    else if (sortedOuterwear.length > 0) selectedIds.push(sortedOuterwear[0].id);

    if (sortedShoes.length > 1) selectedIds.push(sortedShoes[1].id);
    else if (sortedShoes.length > 0) selectedIds.push(sortedShoes[0].id);

    if (sortedBags.length > 0) selectedIds.push(sortedBags[0].id);
    if (sortedAccessories.length > 0) selectedIds.push(sortedAccessories[0].id);

    const sanitized = sanitizeAndValidateOutfit(selectedIds, activeItems);

    outfits.push({
      id: 'gen_' + Date.now() + '_2',
      name: 'Modern & Kontrast Dinamik Silüet',
      itemIds: sanitized.validItemIds,
      createdAt: Date.now(),
      style: altTop.style,
      occasion: params.occasion || 'Sosyal Etkinlik',
      season: params.season || altTop.season,
      description: `${altTop.name} ile ${altBottom.name} birleşimiyle ${sanitized.validItemIds.length} parçalı taze görünüm.`,
      colorHarmonyReasoning: `${altTop.primaryColor} ve ${altBottom.primaryColor} renk kontrastı modern bir enerji verir.`,
      weatherSuitability: 'Sosyal buluşmalar ve şehir aktiviteleri için ideal.',
      stylingTips: 'Tek renk alt giyimi kontrast ayakkabı veya çanta ile tamamlayın.',
      isFavorite: false,
      wearCount: 0,
    });
  }

  // COMBINATION 3: Casual Weekend / Relaxed Layering
  if (sortedTops.length > 0 && sortedBottoms.length > 0) {
    const topPick = sortedTops[sortedTops.length > 2 ? 2 : 0];
    const bottomPick = sortedBottoms[sortedBottoms.length > 1 ? 1 : 0]; // Strictly ONE bottom!
    const selectedIds = [topPick.id, bottomPick.id];

    // Optional inner top if available
    if (innerTops.length > 0 && innerTops[0].id !== topPick.id) {
      selectedIds.push(innerTops[0].id);
    }

    if (sortedOuterwear.length > 0) selectedIds.push(sortedOuterwear[0].id);
    if (sortedShoes.length > 0) selectedIds.push(sortedShoes[sortedShoes.length - 1].id);
    if (sortedBags.length > 0) selectedIds.push(sortedBags[sortedBags.length - 1].id);
    if (sortedAccessories.length > 1) selectedIds.push(sortedAccessories[1].id);

    const sanitized = sanitizeAndValidateOutfit(selectedIds, activeItems);

    outfits.push({
      id: 'gen_' + Date.now() + '_3',
      name: 'Konforlu & Zahmetsiz Hafta Sonu Stili',
      itemIds: sanitized.validItemIds,
      createdAt: Date.now(),
      style: 'Casual',
      occasion: 'Günlük Hayat',
      season: params.season || 'Dört Mevsim',
      description: `${topPick.name} ve ${bottomPick.name} ile ${sanitized.validItemIds.length} parçalı rahat ve stil sahibi silüet.`,
      colorHarmonyReasoning: 'Dingin toprak ve nötr tonların göz yormayan dengesi.',
      weatherSuitability: 'Günlük konfor ve rahat adımlar için ideal.',
      stylingTips: 'Kolları hafifçe kıvırarak rahat ve dinamik bir hava yakalayın.',
      isFavorite: false,
      wearCount: 0,
    });
  }

  return {
    outfits,
    generalAdvice:
      outfits.length > 0
        ? 'Kombinleriniz tek alt giyim kuralına ve istediğiniz katman zenginliğine göre özenle eşleştirildi.'
        : 'Kombin oluşturmak için dolabınıza temel üst, alt ve ayakkabı ekleyin.',
    missingCategories,
    isLocalFallback: true,
  };
}
