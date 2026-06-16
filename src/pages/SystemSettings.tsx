import { Settings } from 'lucide-react';

export default function SystemSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">시스템 및 권한 설정</h2>
        <p className="text-slate-500 text-sm">관리자 계정을 추가하고 각 어드민 메뉴의 접근 권한을 정의합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center text-slate-400 text-sm">
        <Settings className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        관리자 보안 등급 및 계정 생성 기능이 곧 추가됩니다.
      </div>
    </div>
  );
}
