import { CreditCard } from 'lucide-react';

export default function Plans() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">PRO 및 무료 등급 플랜 설정</h2>
        <p className="text-slate-500 text-sm">요금제 등급을 생성하고 기능 접근 제한을 수정합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center text-slate-400 text-sm">
        <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        등급 관리 기능이 곧 추가됩니다.
      </div>
    </div>
  );
}
