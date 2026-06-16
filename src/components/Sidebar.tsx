import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Image, 
  Megaphone, 
  Bell, 
  HelpCircle, 
  Terminal, 
  Settings,
  X 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const menuItems = [
  { path: '/', name: '대시보드', icon: LayoutDashboard },
  { path: '/users', name: '회원관리', icon: Users },
  { path: '/plans', name: '플랜관리', icon: CreditCard },
  { path: '/banners', name: '콘텐츠 관리', icon: Image },
  { path: '/announcements', name: '공지사항 관리', icon: Megaphone },
  { path: '/push', name: '푸시 알림 관리', icon: Bell },
  { path: '/support', name: '고객지원', icon: HelpCircle },
  { path: '/prompts', name: '프롬프트 관리', icon: Terminal },
  { path: '/system', name: '시스템 관리', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 border-r border-slate-800/60
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/30">
              F
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">Fulmi Admin</span>
          </div>
          <button 
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-semibold' 
                    : 'hover:bg-slate-900 hover:text-white text-slate-400'}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
