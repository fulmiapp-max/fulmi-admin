import { Megaphone } from 'lucide-react';

export default function Announcements() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">공지사항 관리 및 팝업 설정</h2>
        <p className="text-slate-500 text-sm">앱 실행 시 노출되는 팝업 공지 및 강제 업데이트 정책을 설정합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center text-slate-400 text-sm">
        <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        팝업 및 공지사항 제어 기능이 곧 추가됩니다.
      </div>
    </div>
  );
}
