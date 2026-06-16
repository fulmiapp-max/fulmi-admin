import { LayoutDashboard, Users, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">대시보드 개요</h2>
        <p className="text-slate-500 text-sm">Fulmi AI 다이어리의 전반적인 사용 통계를 모니터링합니다.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: '누적 가입자', value: '1,248명', change: '+12% 이번주', icon: Users, color: 'text-indigo-600 bg-indigo-50' },
          { label: '일간 활성 사용자(DAU)', value: '382명', change: '+5% 어제 대비', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: '유료 PRO 플랜', value: '45명', change: '점유율 3.6%', icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
          { label: '이번달 작성 일기', value: '2,940건', change: '평균 7.2건/인', icon: LayoutDashboard, color: 'text-blue-600 bg-blue-50' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className="text-2xl font-extrabold text-slate-800">{stat.value}</div>
                <span className="text-xs font-medium text-slate-400">{stat.change}</span>
              </div>
              <div className={`p-3.5 rounded-xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
