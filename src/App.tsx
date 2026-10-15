import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { HomeDashboard } from './components/home/HomeDashboard';
import { WardrobeGrid } from './components/wardrobe/WardrobeGrid';
import { AddClothingModal } from './components/wardrobe/AddClothingModal';
import { ClothingDetailModal } from './components/wardrobe/ClothingDetailModal';
import { OutfitGenerator } from './components/outfits/OutfitGenerator';
import { OutfitsList } from './components/outfits/OutfitsList';
import { OutfitDetailModal } from './components/outfits/OutfitDetailModal';
import { WeeklyCalendar } from './components/calendar/WeeklyCalendar';
import { StyleAnalytics } from './components/analytics/StyleAnalytics';
import { SettingsView } from './components/settings/SettingsView';
import {
  ClothingItem,
  Outfit,
  OutfitPlan,
  UserPreferences,
  WeatherInfo,
} from './types/wardrobe';
import { wardrobeDb } from './services/db';
import { checkServerStatus, fetchLiveWeather } from './services/api';
import { DEMO_CLOTHING_ITEMS, DEMO_OUTFITS } from './data/demoWardrobe';
import { Shirt, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isLoading, setIsLoading] = useState(true);

  // Core Data
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [plans, setPlans] = useState<OutfitPlan[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredStyles: ['Minimalist', 'Smart Casual'],
    preferredColors: ['Siyah', 'Krem', 'Bej'],
    city: 'İstanbul',
    allowMultipleOutfitsPerDay: true,
    theme: 'light',
    genderPreference: 'unisex',
  });
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Initial Data Load from IndexedDB and API
  useEffect(() => {
    async function init() {
      try {
        const [savedItems, savedOutfits, savedPlans, savedPrefs, serverStatus] =
          await Promise.all([
            wardrobeDb.getAllItems(),
            wardrobeDb.getAllOutfits(),
            wardrobeDb.getAllPlans(),
            wardrobeDb.getPreferences(),
            checkServerStatus(),
          ]);

        setItems(savedItems);
        setOutfits(savedOutfits);
        setPlans(savedPlans);
        setPreferences(savedPrefs);
        setHasGeminiKey(serverStatus.hasGeminiKey);

        // Fetch live weather for configured city
        const weatherData = await fetchLiveWeather(savedPrefs.city || 'İstanbul');
        setWeather(weatherData);

        // If completely empty first time, automatically seed with demo items for immediate delight!
        if (savedItems.length === 0 && savedOutfits.length === 0) {
          await wardrobeDb.saveItems(DEMO_CLOTHING_ITEMS);
          await wardrobeDb.saveOutfits(DEMO_OUTFITS);
          setItems(DEMO_CLOTHING_ITEMS);
          setOutfits(DEMO_OUTFITS);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const itemsMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // --- ITEM ACTIONS ---
  const handleSaveItem = async (item: ClothingItem) => {
    await wardrobeDb.saveItem(item);
    setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
    showToast(`"${item.name}" gardırobunuza eklendi.`);
  };

  const handleUpdateItem = async (updated: ClothingItem) => {
    await wardrobeDb.saveItem(updated);
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelectedItem(updated);
    showToast('Kıyafet bilgileri güncellendi.');
  };

  const handleDeleteItem = async (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    await wardrobeDb.deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    // Also update any outfits that contained this item
    const refreshedOutfits = await wardrobeDb.getAllOutfits();
    setOutfits(refreshedOutfits);
    showToast(`"${itemToDelete?.name || 'Kıyafet'}" silindi.`);
  };

  const handleToggleFavoriteItem = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const updated = { ...item, isFavorite: !item.isFavorite };
    await wardrobeDb.saveItem(updated);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    if (selectedItem?.id === id) setSelectedItem(updated);
  };

  const handleQuickLogWear = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await wardrobeDb.logWear([id]);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, wearCount: (i.wearCount || 0) + 1 } : i))
    );
    showToast('Kullanım kaydı eklendi (+1).');
  };

  // --- OUTFIT ACTIONS ---
  const handleSaveOutfit = async (outfit: Outfit) => {
    await wardrobeDb.saveOutfit(outfit);
    setOutfits((prev) => [outfit, ...prev.filter((o) => o.id !== outfit.id)]);
    showToast(`"${outfit.name}" kombinlerinize kaydedildi.`);
  };

  const handleUpdateOutfit = async (updated: Outfit) => {
    await wardrobeDb.saveOutfit(updated);
    setOutfits((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelectedOutfit(updated);
    showToast('Kombin güncellendi.');
  };

  const handleDeleteOutfit = async (id: string) => {
    await wardrobeDb.deleteOutfit(id);
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    setPlans((prev) => prev.filter((p) => p.outfitId !== id));
    showToast('Kombin silindi.');
  };

  const handleToggleFavoriteOutfit = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const outfit = outfits.find((o) => o.id === id);
    if (!outfit) return;

    const updated = { ...outfit, isFavorite: !outfit.isFavorite };
    await wardrobeDb.saveOutfit(updated);
    setOutfits((prev) => prev.map((o) => (o.id === id ? updated : o)));
    if (selectedOutfit?.id === id) setSelectedOutfit(updated);
  };

  const handleLogOutfitWear = async (
    outfitId: string,
    itemIds: string[],
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    await wardrobeDb.logWear(itemIds, outfitId);
    setOutfits((prev) =>
      prev.map((o) =>
        o.id === outfitId ? { ...o, wearCount: (o.wearCount || 0) + 1 } : o
      )
    );
    setItems((prev) =>
      prev.map((i) =>
        itemIds.includes(i.id) ? { ...i, wearCount: (i.wearCount || 0) + 1 } : i
      )
    );
    showToast('Kombin bugün giyildi olarak işaretlendi (+1)!');
  };

  // --- CALENDAR PLAN ACTIONS ---
  const handleSavePlan = async (plan: OutfitPlan) => {
    await wardrobeDb.savePlan(plan);
    setPlans((prev) => [...prev.filter((p) => p.id !== plan.id), plan]);
    showToast('Kombin takvime eklendi.');
  };

  const handleDeletePlan = async (planId: string) => {
    await wardrobeDb.deletePlan(planId);
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    showToast('Plan kaldırıldı.');
  };

  const handleScheduleOutfitDirect = (outfit: Outfit) => {
    setCurrentTab('calendar');
    showToast(`"${outfit.name}" için takvimden gün seçin.`);
  };

  // --- DEMO & PREFERENCES ---
  const handleLoadDemoData = async () => {
    await wardrobeDb.saveItems(DEMO_CLOTHING_ITEMS);
    await wardrobeDb.saveOutfits(DEMO_OUTFITS);
    setItems(DEMO_CLOTHING_ITEMS);
    setOutfits(DEMO_OUTFITS);
    showToast('Örnek dolap (22 parça ve 6 kombin) yüklendi.');
  };

  const handleRemoveDemoData = async () => {
    await wardrobeDb.removeDemoData();
    const cleanItems = await wardrobeDb.getAllItems();
    const cleanOutfits = await wardrobeDb.getAllOutfits();
    setItems(cleanItems);
    setOutfits(cleanOutfits);
    showToast('Örnek parçalar dolaptan temizlendi.');
  };

  const handleClearAllData = async () => {
    await wardrobeDb.clearAll();
    setItems([]);
    setOutfits([]);
    setPlans([]);
    showToast('Tüm gardırop verileri sıfırlandı.');
  };

  const handleExportBackup = async () => {
    const jsonStr = await wardrobeDb.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DolabimdaNeVarAI_Yedek_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Yedek dosyanız indirildi.');
  };

  const handleImportBackup = async (jsonStr: string) => {
    const success = await wardrobeDb.importBackup(jsonStr);
    if (success) {
      const reItems = await wardrobeDb.getAllItems();
      const reOutfits = await wardrobeDb.getAllOutfits();
      const rePlans = await wardrobeDb.getAllPlans();
      const rePrefs = await wardrobeDb.getPreferences();
      setItems(reItems);
      setOutfits(reOutfits);
      setPlans(rePlans);
      setPreferences(rePrefs);
      showToast('Yedek başarıyla geri yüklendi.');
    }
  };

  const handleRefreshWeather = async (city: string) => {
    const w = await fetchLiveWeather(city);
    setWeather(w);
  };

  const handleUpdatePreferences = async (newPrefs: UserPreferences) => {
    await wardrobeDb.savePreferences(newPrefs);
    setPreferences(newPrefs);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center shadow-lg mb-4 animate-pulse">
          <Shirt className="w-8 h-8 text-[#E6DEC8]" />
        </div>
        <h1 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
          Dolabımda Ne Var AI
        </h1>
        <p className="text-xs text-[#8C7A6B] mt-1 tracking-wider uppercase">
          Kişisel gardırop yükleniyor...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        itemCount={items.length}
        outfitCount={outfits.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 pb-20 md:pb-10">
        {/* Top Header */}
        <Header
          weather={weather}
          hasGeminiKey={hasGeminiKey}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenGenerate={() => setCurrentTab('generate')}
        />

        {/* Tab Views */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {currentTab === 'home' && (
            <HomeDashboard
              items={items}
              outfits={outfits}
              plans={plans}
              weather={weather}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenGenerate={() => setCurrentTab('generate')}
              onNavigateToWardrobe={() => setCurrentTab('wardrobe')}
              onNavigateToOutfits={() => setCurrentTab('outfits')}
              onNavigateToCalendar={() => setCurrentTab('calendar')}
              onSelectItem={(item) => setSelectedItem(item)}
              onSelectOutfit={(outfit) => setSelectedOutfit(outfit)}
              onLoadDemoData={handleLoadDemoData}
              onLogWear={(outfitId, itemIds) => handleLogOutfitWear(outfitId, itemIds)}
            />
          )}

          {currentTab === 'wardrobe' && (
            <WardrobeGrid
              items={items}
              onSelectItem={(item) => setSelectedItem(item)}
              onToggleFavorite={handleToggleFavoriteItem}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onQuickLogWear={handleQuickLogWear}
            />
          )}

          {currentTab === 'generate' && (
            <OutfitGenerator
              items={items}
              savedOutfits={outfits}
              weather={weather}
              hasGeminiKey={hasGeminiKey}
              onSaveOutfit={handleSaveOutfit}
              onToggleFavorite={handleToggleFavoriteOutfit}
              onSelectOutfit={(outfit) => setSelectedOutfit(outfit)}
              onScheduleOutfit={handleScheduleOutfitDirect}
            />
          )}

          {currentTab === 'outfits' && (
            <OutfitsList
              outfits={outfits}
              itemsMap={itemsMap}
              onSelectOutfit={(outfit) => setSelectedOutfit(outfit)}
              onToggleFavorite={handleToggleFavoriteOutfit}
              onScheduleOutfit={handleScheduleOutfitDirect}
              onLogWear={(outfitId, itemIds, e) => handleLogOutfitWear(outfitId, itemIds, e)}
              onNavigateToGenerate={() => setCurrentTab('generate')}
            />
          )}

          {currentTab === 'calendar' && (
            <WeeklyCalendar
              plans={plans}
              outfits={outfits}
              itemsMap={itemsMap}
              weather={weather}
              onSavePlan={handleSavePlan}
              onDeletePlan={handleDeletePlan}
              onLogWear={(outfitId, itemIds) => handleLogOutfitWear(outfitId, itemIds)}
              onSelectOutfit={(outfit) => setSelectedOutfit(outfit)}
              onNavigateToGenerate={() => setCurrentTab('generate')}
            />
          )}

          {currentTab === 'analytics' && (
            <StyleAnalytics
              items={items}
              outfits={outfits}
              onSelectItem={(item) => setSelectedItem(item)}
              onNavigateToWardrobe={() => setCurrentTab('wardrobe')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              weather={weather}
              onRefreshWeather={handleRefreshWeather}
              hasGeminiKey={hasGeminiKey}
              onLoadDemoData={handleLoadDemoData}
              onRemoveDemoData={handleRemoveDemoData}
              onClearAllData={handleClearAllData}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              itemCount={items.length}
              outfitCount={outfits.length}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        itemCount={items.length}
      />

      {/* Modals */}
      <AddClothingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveItem}
        hasGeminiKey={hasGeminiKey}
      />

      <ClothingDetailModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteItem}
        onToggleFavorite={(id) => handleToggleFavoriteItem(id)}
        onLogWear={(id) => handleQuickLogWear(id)}
      />

      <OutfitDetailModal
        outfit={selectedOutfit}
        isOpen={Boolean(selectedOutfit)}
        onClose={() => setSelectedOutfit(null)}
        itemsMap={itemsMap}
        allItems={items}
        onUpdateOutfit={handleUpdateOutfit}
        onDeleteOutfit={handleDeleteOutfit}
        onToggleFavorite={(id) => handleToggleFavoriteOutfit(id)}
        onLogWear={(outfitId, itemIds) => handleLogOutfitWear(outfitId, itemIds)}
        onSchedule={handleScheduleOutfitDirect}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-4 py-2.5 rounded-2xl bg-[#1C1917] text-[#FAF8F5] text-xs sm:text-sm font-semibold shadow-xl border border-white/10 flex items-center gap-2">
            <Check className="w-4 h-4 text-[#E6DEC8]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
