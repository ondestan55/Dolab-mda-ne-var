import React from 'react';
import { Home, Layers, Sparkles, BookmarkCheck, CalendarDays, Settings } from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  itemCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  itemCount,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Ana Sayfa', icon: Home },
    { id: 'wardrobe', label: 'Dolabım', icon: Layers },
    { id: 'generate', label: 'AI Kombin', icon: Sparkles },
    { id: 'outfits', label: 'Kombinler', icon: BookmarkCheck },
    { id: 'calendar', label: 'Takvim', icon: CalendarDays },
    { id: 'settings', label: 'Profil', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-lg border-t border-[#E7E0D8] px-2 py-2 flex items-center justify-around shadow-lg safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              isActive ? 'text-[#1C1917]' : 'text-[#8C7A6B] hover:text-[#44403C]'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 text-[#1C1917]' : 'text-[#8C7A6B]'
                }`}
              />
              {tab.id === 'wardrobe' && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-[#4A5320] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 font-medium ${
                isActive ? 'font-semibold text-[#1C1917]' : 'text-[#8C7A6B]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
