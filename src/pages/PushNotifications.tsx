import { Bell } from 'lucide-react';

export default function PushNotifications() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">푸시 알림 관리</h2>
        <p className="text-slate-500 text-sm">타겟 유저층을 대상으로 시스템 알림 및 마케팅 알림을 수동 발송합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center text-slate-400 text-sm">
        <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        푸시 알림 전송 기능이 곧 추가됩니다.
      </div>
    </div>
  );
}
