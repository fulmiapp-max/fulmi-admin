import { Image } from 'lucide-react';

export default function Banners() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">배너 및 콘텐츠 관리</h2>
        <p className="text-slate-500 text-sm">인앱 상단 배너 이미지와 랜딩 페이지 배너를 관리합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center text-slate-400 text-sm">
        <Image className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        배너 콘텐츠 관리 기능이 곧 추가됩니다.
      </div>
    </div>
  );
}
