import { useLocation } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { menuItems } from './Sidebar';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();

  // Find the name of the current menu path
  const currentMenu = menuItems.find(item => item.path === location.pathname);
  const pageTitle = currentMenu ? currentMenu.name : '관리자';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm shadow-slate-100/50">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu Trigger for Mobile */}
        <button
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          onClick={onMenuToggle}
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{pageTitle}</h1>
      </div>

      {/* Admin Profile Interface */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <User className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Admin User</span>
        </div>
      </div>
    </header>
  );
}
