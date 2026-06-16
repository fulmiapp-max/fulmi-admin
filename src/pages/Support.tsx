import { HelpCircle } from 'lucide-react';

export default function Support() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">고객지원 센터</h2>
        <p className="text-slate-500 text-sm">FAQ, 공지사항 및 1:1 고객 문의(Q&A) 내역을 관리합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center text-slate-400 text-sm">
        <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        1:1 문의 처리 및 FAQ 에디터 기능이 곧 추가됩니다.
      </div>
    </div>
  );
}
