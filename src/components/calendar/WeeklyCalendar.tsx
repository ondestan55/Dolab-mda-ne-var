import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CloudSun,
  Sparkles,
  Check,
  X,
  PlusCircle,
} from 'lucide-react';
import {
  OutfitPlan,
  Outfit,
  ClothingItem,
  WeatherInfo,
} from '../../types/wardrobe';

interface WeeklyCalendarProps {
  plans: OutfitPlan[];
  outfits: Outfit[];
  itemsMap: Map<string, ClothingItem>;
  weather: WeatherInfo | null;
  onSavePlan: (plan: OutfitPlan) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
  onLogWear: (outfitId: string, itemIds: string[]) => void;
  onSelectOutfit: (outfit: Outfit) => void;
  onNavigateToGenerate: () => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  plans,
  outfits,
  itemsMap,
  weather,
  onSavePlan,
  onDeletePlan,
  onLogWear,
  onSelectOutfit,
  onNavigateToGenerate,
}) => {
  // Current week offset: 0 is current week, -1 previous week, +1 next week
  const [weekOffset, setWeekOffset] = useState(0);
  const [assigningDate, setAssigningDate] = useState<string | null>(null);

  // Compute Monday to Sunday dates for the current weekOffset
  const getWeekDates = (offset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday + offset * 7);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(d);
      const dayNum = d.getDate();
      const monthName = new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(d);
      const isToday =
        new Date().toISOString().split('T')[0] === isoDate;

      weekDays.push({
        dateStr: isoDate,
        dayName,
        dayNum,
        monthName,
        isToday,
      });
    }
    return weekDays;
  };

  const weekDays = getWeekDates(weekOffset);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const handleAssignOutfit = async (outfitId: string) => {
    if (!assigningDate) return;
    const existing = plans.find((p) => p.date === assigningDate && p.outfitId === outfitId);
    if (!existing) {
      const newPlan: OutfitPlan = {
        id: 'plan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        date: assigningDate,
        outfitId,
      };
      await onSavePlan(newPlan);
    }
    setAssigningDate(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
            Stil Ajandası
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight">
            Haftalık Kombin Planı
          </h2>
          <p className="text-xs sm:text-sm text-[#786C60] mt-1">
            {weekStart.dayNum} {weekStart.monthName} — {weekEnd.dayNum} {weekEnd.monthName} haftası
          </p>
        </div>

        {/* Week Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-2 rounded-xl bg-white border border-[#D5C9BE] text-[#5C5248] hover:bg-[#F3EDE6] transition"
            title="Önceki Hafta"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              weekOffset === 0
                ? 'bg-[#1C1917] text-[#FAF8F5] border-[#1C1917]'
                : 'bg-white text-[#5C5248] border-[#D5C9BE] hover:bg-[#F3EDE6]'
            }`}
          >
            Bugüne Git
          </button>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-2 rounded-xl bg-white border border-[#D5C9BE] text-[#5C5248] hover:bg-[#F3EDE6] transition"
            title="Sonraki Hafta"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Days Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayPlans = plans.filter((p) => p.date === day.dateStr);

          return (
            <div
              key={day.dateStr}
              className={`rounded-3xl border p-4 flex flex-col justify-between min-h-[220px] transition ${
                day.isToday
                  ? 'bg-[#FAF8F5] border-[#1C1917] ring-1 ring-[#1C1917] shadow-sm'
                  : 'bg-[#FAF8F5] border-[#E7E0D8]'
              }`}
            >
              {/* Day Header */}
              <div className="border-b border-[#E7E0D8] pb-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1C1917] capitalize">
                    {day.dayName}
                  </span>
                  {day.isToday && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#1C1917] text-[#FAF8F5]">
                      Bugün
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1 text-[#8C7A6B]">
                  <span className="font-serif-editorial text-lg font-bold text-[#292524]">
                    {day.dayNum} {day.monthName}
                  </span>
                  {day.isToday && weather && (
                    <span className="text-[10px] font-medium text-[#4A5320] flex items-center gap-1">
                      <CloudSun className="w-3 h-3" />
                      {weather.temperature}°C
                    </span>
                  )}
                </div>
              </div>

              {/* Day Plans Container */}
              <div className="flex-1 py-3 space-y-2">
                {dayPlans.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-2 text-[#9C8F83]">
                    <span className="text-[11px] block">Plan yok</span>
                  </div>
                ) : (
                  dayPlans.map((plan) => {
                    const outfit = outfits.find((o) => o.id === plan.outfitId);
                    if (!outfit) return null;

                    const outfitItems = outfit.itemIds
                      .map((id) => itemsMap.get(id))
                      .filter((i): i is ClothingItem => i !== undefined);

                    return (
                      <div
                        key={plan.id}
                        onClick={() => onSelectOutfit(outfit)}
                        className="p-2.5 rounded-2xl bg-white border border-[#D5C9BE] hover:border-[#1C1917] cursor-pointer transition shadow-2xs group relative"
                      >
                        {/* Mini Collage */}
                        <div className="flex items-center gap-1.5 mb-1.5 overflow-hidden">
                          {outfitItems.slice(0, 3).map((item, idx) => (
                            <img
                              key={item.id + '_' + idx}
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-8 h-10 rounded-lg object-cover bg-stone-100"
                            />
                          ))}
                        </div>

                        <h5 className="font-serif-editorial text-xs font-bold text-[#1C1917] truncate">
                          {outfit.name}
                        </h5>
                        <span className="text-[10px] text-[#8C7A6B] block">
                          {outfit.style}
                        </span>

                        {/* Actions Overlay */}
                        <div
                          className="pt-1.5 mt-1 border-t border-[#EFE9DF] flex items-center justify-between"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onLogWear(outfit.id, outfit.itemIds)}
                            className="text-[10px] text-[#4A5320] hover:underline font-semibold flex items-center gap-1"
                            title="Bugün Giydim (+1)"
                          >
                            <PlusCircle className="w-3 h-3" /> Giydim
                          </button>

                          <button
                            onClick={() => onDeletePlan(plan.id)}
                            className="text-[10px] text-rose-700 hover:text-rose-900"
                            title="Planı Kaldır"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Outfit to this Day Button */}
              <button
                onClick={() => setAssigningDate(day.dateStr)}
                className="w-full py-1.5 rounded-xl border border-dashed border-[#D5C9BE] hover:border-[#1C1917] hover:bg-[#F3EDE6] text-xs font-medium text-[#5C5248] transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kombin Ata</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Outfit Selector Modal for Day Assignment */}
      {assigningDate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] w-full max-w-xl rounded-3xl border border-[#E7E0D8] shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
              <div>
                <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
                  Planlama
                </span>
                <h3 className="font-serif-editorial text-2xl font-bold text-[#1C1917]">
                  {assigningDate} Günü İçin Kombin Seçin
                </h3>
              </div>
              <button
                onClick={() => setAssigningDate(null)}
                className="p-2 rounded-full hover:bg-[#EAE2D5] text-[#786C60]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2.5">
              {outfits.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs text-[#786C60]">
                    Kayıtlı kombininiz bulunmuyor. Önce AI Kombin Oluşturucu ile kombinler oluşturup kaydedebilirsiniz.
                  </p>
                  <button
                    onClick={() => {
                      setAssigningDate(null);
                      onNavigateToGenerate();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1C1917] text-[#FAF8F5]"
                  >
                    <Sparkles className="w-4 h-4 text-[#E6DEC8]" />
                    Kombin Oluştur
                  </button>
                </div>
              ) : (
                outfits.map((outfit) => {
                  const outfitItems = outfit.itemIds
                    .map((id) => itemsMap.get(id))
                    .filter((i): i is ClothingItem => i !== undefined);

                  return (
                    <div
                      key={outfit.id}
                      onClick={() => handleAssignOutfit(outfit.id)}
                      className="p-3 rounded-2xl bg-white border border-[#D5C9BE] hover:border-[#1C1917] cursor-pointer transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center -space-x-2 overflow-hidden">
                          {outfitItems.slice(0, 3).map((item, idx) => (
                            <img
                              key={item.id + '_' + idx}
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-10 h-12 rounded-lg object-cover border-2 border-white"
                            />
                          ))}
                        </div>
                        <div>
                          <h4 className="font-serif-editorial text-base font-bold text-[#1C1917] group-hover:text-[#4A5320]">
                            {outfit.name}
                          </h4>
                          <span className="text-xs text-[#8C7A6B]">
                            {outfit.style} • {outfit.occasion}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#F0EBE1] text-[#2C2723] group-hover:bg-[#1C1917] group-hover:text-[#FAF8F5] transition">
                        Bu Günü Seç
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
