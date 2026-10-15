import { ClothingItem, Outfit } from '../types/wardrobe';

export interface GenerationParams {
  occasion?: string;
  style?: string;
  season?: string;
  weather?: string;
  temperature?: number;
  colorPreference?: string;
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

function areColorsHarmonious(colorA: string, colorB: string): boolean {
  const a = colorA.toLowerCase();
  const b = colorB.toLowerCase();
  if (a === b) return true; // Monochrome
  if (NEUTRALS.some((n) => a.includes(n)) || NEUTRALS.some((n) => b.includes(n))) return true; // Neutral matches anything
  if (
    (a.includes('mavi') && b.includes('bej')) ||
    (a.includes('haki') && b.includes('krem')) ||
    (a.includes('lacivert') && b.includes('bordo'))
  )
    return true;
  return false;
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

  // Helper score to sort items according to preferences
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

  // Option 1: Top + Bottom + Shoes (+ Outerwear/Bag if available)
  if (sortedTops.length > 0 && sortedBottoms.length > 0) {
    const top = sortedTops[0];
    // Find compatible bottom
    const bottom =
      sortedBottoms.find((b) => areColorsHarmonious(top.primaryColor, b.primaryColor)) ||
      sortedBottoms[0];
    const shoe = sortedShoes[0];
    const jacket =
      params.temperature && params.temperature < 20 && sortedOuterwear.length > 0
        ? sortedOuterwear[0]
        : undefined;
    const bag = sortedBags[0];

    const selectedIds = [top.id, bottom.id];
    if (jacket) selectedIds.push(jacket.id);
    if (shoe) selectedIds.push(shoe.id);
    if (bag) selectedIds.push(bag.id);

    outfits.push({
      id: 'gen_' + Date.now() + '_1',
      name: `${params.style || 'Şık'} & Dengeli Günlük Seçim`,
      itemIds: selectedIds,
      createdAt: Date.now(),
      style: params.style || top.style,
      occasion: params.occasion || 'Günlük Hayat',
      season: params.season || top.season,
      description: `${top.name} ile ${bottom.name} arasındaki zamansız birliktelik.${jacket ? ` ${jacket.name} katmanı ile tamamlandı.` : ''}`,
      colorHarmonyReasoning: `${top.primaryColor} ve ${bottom.primaryColor} renk uyumu dengeli ve göz yormayan bir silüet oluşturur.`,
      weatherSuitability: params.weather
        ? `${params.weather} hava koşulları ve ${params.temperature || 19}°C sıcaklık için ideal katman dengesi.`
        : 'Mevsimsel geçiş günleri için konforlu.',
      stylingTips:
        top.subcategory.toLowerCase().includes('tişört') || top.subcategory.toLowerCase().includes('gömlek')
          ? 'Üst parçayı alt giyimin içine hafifçe toplayarak bel hattınızı belirginleştirebilirsiniz.'
          : 'Kolları hafifçe kıvırarak rahat ve havalı bir hava verin.',
      isFavorite: false,
      wearCount: 0,
    });
  }

  // Option 2: Dress or Alternative Top + Bottom
  if (sortedDresses.length > 0) {
    const dress = sortedDresses[0];
    const shoe = sortedShoes.length > 1 ? sortedShoes[1] : sortedShoes[0];
    const jacket = sortedOuterwear.length > 0 ? sortedOuterwear[0] : undefined;
    const bag = sortedBags.length > 1 ? sortedBags[1] : sortedBags[0];

    const selectedIds = [dress.id];
    if (jacket) selectedIds.push(jacket.id);
    if (shoe) selectedIds.push(shoe.id);
    if (bag) selectedIds.push(bag.id);

    outfits.push({
      id: 'gen_' + Date.now() + '_2',
      name: 'Tek Parça Zahmetsiz Zarafet',
      itemIds: selectedIds,
      createdAt: Date.now(),
      style: params.style || 'Şık',
      occasion: params.occasion || dress.occasion,
      season: params.season || dress.season,
      description: `${dress.name} tek başına güçlü bir silüet sunar.${jacket ? ` Üzerine eklenen ${jacket.name} ile modern kontrast yaratıldı.` : ''}`,
      colorHarmonyReasoning: `${dress.primaryColor} tonunun asaletini tamamlayan minimal tamamlayıcı parçalar.`,
      weatherSuitability: 'Hafif ve gün boyu hareket kolaylığı sağlayan bütünlük.',
      stylingTips: 'İnce bir takı veya minimal çanta ile odağı elbisenin formunda tutun.',
      isFavorite: false,
      wearCount: 0,
    });
  } else if (sortedTops.length > 1 && sortedBottoms.length > 0) {
    // Alternative second outfit
    const top2 = sortedTops[1];
    const bottom2 = sortedBottoms.length > 1 ? sortedBottoms[1] : sortedBottoms[0];
    const shoe2 = sortedShoes.length > 1 ? sortedShoes[1] : sortedShoes[0];
    const acc = sortedAccessories[0];

    const selectedIds = [top2.id, bottom2.id];
    if (shoe2) selectedIds.push(shoe2.id);
    if (acc) selectedIds.push(acc.id);

    outfits.push({
      id: 'gen_' + Date.now() + '_2',
      name: 'Modern & Kontrast Alternatif',
      itemIds: selectedIds,
      createdAt: Date.now(),
      style: top2.style,
      occasion: params.occasion || 'Sosyal Etkinlik',
      season: params.season || top2.season,
      description: `${top2.name} ile ${bottom2.name} birleşimiyle daha dinamik bir hava.`,
      colorHarmonyReasoning: `${top2.primaryColor} ve ${bottom2.primaryColor} kontrastı enerjik ve modern bir hava verir.`,
      weatherSuitability: 'Günlük aktiviteler ve sosyal buluşmalar için pratik.',
      stylingTips: acc ? `${acc.name} aksesuarı ile kombine odak noktası ekleyin.` : 'Sade ayakkabılarla tamamlayın.',
      isFavorite: false,
      wearCount: 0,
    });
  }

  // Option 3: Third combination if enough pieces
  if (sortedTops.length > 2 && sortedBottoms.length > 0) {
    const top3 = sortedTops[2];
    const bottom3 = sortedBottoms[sortedBottoms.length - 1];
    const shoe3 = sortedShoes[0];
    const jacket3 = sortedOuterwear.length > 1 ? sortedOuterwear[1] : sortedOuterwear[0];

    const selectedIds = [top3.id, bottom3.id];
    if (jacket3) selectedIds.push(jacket3.id);
    if (shoe3) selectedIds.push(shoe3.id);

    outfits.push({
      id: 'gen_' + Date.now() + '_3',
      name: 'Rahat Hafta Sonu Silüeti',
      itemIds: selectedIds,
      createdAt: Date.now(),
      style: 'Casual',
      occasion: 'Günlük Hayat',
      season: params.season || 'Dört Mevsim',
      description: `${top3.name} ve ${bottom3.name} ile maksimum konfor ve stil.`,
      colorHarmonyReasoning: 'Doğal toprak ve nötr tonların dingin birleşimi.',
      weatherSuitability: 'Değişken hava koşullarında katmanlı kullanım sağlar.',
      stylingTips: 'Sneaker veya rahat botlarla tamamlayarak adımlarınızı özgürleştirin.',
      isFavorite: false,
      wearCount: 0,
    });
  }

  return {
    outfits,
    generalAdvice:
      outfits.length > 0
        ? 'Gardırobunuzdaki parçalarla hazırlanan kombinler, mevcut kıyafetlerinizi farklı şekillerde değerlendirmeniz için tasarlandı.'
        : 'Kombin oluşturmak için dolabınıza daha fazla temel parça (özellikle üst, alt ve ayakkabı) ekleyin.',
    missingCategories,
    isLocalFallback: true,
  };
}
