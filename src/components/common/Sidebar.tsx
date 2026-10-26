import React from 'react';
import {
  Home,
  Layers,
  Sparkles,
  BookmarkCheck,
  CalendarDays,
  BarChart3,
  Settings,
  Shirt,
  ShieldCheck,
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'wardrobe'
  | 'generate'
  | 'outfits'
  | 'calendar'
  | 'analytics'
  | 'settings'
  | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  itemCount: number;
  outfitCount: number;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  itemCount,
  outfitCount,
  isAdmin = false,
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.ElementType; badge?: number; adminOnly?: boolean }[] = [
    { id: 'home', label: 'Ana Sayfa', icon: Home },
    { id: 'wardrobe', label: 'Dijital Dolabım', icon: Layers, badge: itemCount },
    { id: 'generate', label: 'AI Kombin Oluştur', icon: Sparkles },
    { id: 'outfits', label: 'Kombinlerim', icon: BookmarkCheck, badge: outfitCount },
    { id: 'calendar', label: 'Haftalık Plan', icon: CalendarDays },
    { id: 'analytics', label: 'Stil Analizim', icon: BarChart3 },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  if (isAdmin) {
    menuItems.push({
      id: 'admin',
      label: 'Yönetici Paneli',
      icon: ShieldCheck,
      adminOnly: true,
    });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#F7F4EE] border-r border-[#E7E0D8] min-h-screen p-5 select-none shrink-0">
      {/* Brand Header */}
      <div className="pb-6 border-b border-[#E7E0D8]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center shadow-xs">
            <Shirt className="w-5 h-5 text-[#E6DEC8]" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-[#8C7A6B]">
              Fashion Studio AI
            </span>
            <h1 className="font-serif-editorial text-xl font-bold tracking-tight text-[#1C1917] leading-tight">
              Dolabımda Ne Var
            </h1>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-[#786C60] leading-snug">
          Dolabındaki Potansiyeli Keşfet.
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#1C1917] text-[#FAF8F5] shadow-xs'
                  : 'text-[#44403C] hover:bg-[#EFE9DF] hover:text-[#1C1917]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-[#E6DEC8]' : 'text-[#8C7A6B]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-[#38332E] text-[#E6DEC8]'
                      : 'bg-[#EAE2D5] text-[#6B5E52]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Wardrobe Quick Stats Card */}
      <div className="pt-4 border-t border-[#E7E0D8]/80">
        <div className="p-3.5 rounded-2xl bg-[#EDE5D8]/60 border border-[#E0D7C8] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B5E52]">
            <span className="font-medium">Dolap Özeti</span>
            <span className="text-[11px] font-semibold text-[#2F4F2F]">
              Kullanıma Hazır
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-center">
            <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E7E0D8]">
              <span className="block text-base font-bold text-[#1C1917]">
                {itemCount}
              </span>
              <span className="text-[10px] text-[#8C7A6B]">Kıyafet</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E7E0D8]">
              <span className="block text-base font-bold text-[#1C1917]">
                {outfitCount}
              </span>
              <span className="text-[10px] text-[#8C7A6B]">Kombin</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
