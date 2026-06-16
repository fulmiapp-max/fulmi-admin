import { Users as UsersIcon, Search, Filter } from 'lucide-react';

export default function Users() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">회원 조회 및 관리</h2>
          <p className="text-slate-500 text-sm">서비스 가입 유저 목록을 검색하고 상세 상태를 확인합니다.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="이메일, 닉네임 검색..." 
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
          <button className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
            <Filter className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-8 text-center text-slate-400 text-sm">
          <UsersIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          회원 목록 데이터를 불러오는 중이거나 아직 준비되지 않았습니다.
        </div>
      </div>
    </div>
  );
}
