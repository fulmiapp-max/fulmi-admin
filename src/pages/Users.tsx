import { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Shield, Edit, Loader2, Check, AlertCircle, X, Sparkles, Clock, Globe, Bell, UserCheck, UserX, Copy } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://fulmiapp-1051039096883.us-central1.run.app';

interface UserItem {
  id: number;
  firebaseUid?: string;
  email: string | null;
  displayName: string | null;
  membershipTier: string;
  isAnonymous: boolean;
  timezone: string;
  language: string;
  fcmTokenCount: number;
  createdAt: string | Date | null;
  trialStartsAt: string | Date | null;
  trialEndsAt: string | Date | null;
  subscriptionStartsAt: string | Date | null;
  subscriptionEndsAt: string | Date | null;
}

export default function Users() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 수정 모달 상태
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editLanguage, setEditLanguage] = useState<string>('ko');
  const [editTier, setEditTier] = useState<string>('free');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-admin-bypass': 'admin'
        }
      });

      if (!response.ok) {
        throw new Error('회원 목록을 불러오는 데 실패했습니다.');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setEditDisplayName(user.displayName || '');
    setEditLanguage(user.language || 'ko');
    setEditTier(user.membershipTier || 'free');
    setModalMsg(null);

    // 날짜 포맷팅 (datetime-local 입력창용)
    if (user.trialStartsAt) {
      const d = new Date(user.trialStartsAt);
      setEditStartDate(!isNaN(d.getTime()) ? d.toISOString().slice(0, 16) : '');
    } else {
      setEditStartDate('');
    }

    if (user.trialEndsAt) {
      const d = new Date(user.trialEndsAt);
      setEditEndDate(!isNaN(d.getTime()) ? d.toISOString().slice(0, 16) : '');
    } else {
      setEditEndDate('');
    }
  };

  const handleSaveUserInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSaving(true);
    setModalMsg(null);

    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/users/${editingUser.id}/membership`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-admin-bypass': 'admin'
        },
        body: JSON.stringify({
          displayName: editDisplayName.trim() || null,
          language: editLanguage,
          membershipTier: editTier,
          trialStartsAt: editStartDate ? new Date(editStartDate).toISOString() : null,
          trialEndsAt: editEndDate ? new Date(editEndDate).toISOString() : null,
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '회원 정보를 업데이트하는 데 실패했습니다.');
      }

      setModalMsg({ type: 'success', text: '회원 상세 정보 및 체험 기간이 성공적으로 저장되었습니다.' });
      setTimeout(() => {
        setEditingUser(null);
        fetchUsers();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setModalMsg({ type: 'error', text: err.message || '업데이트에 실패했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 회원 통계 계산
  const totalCount = users.length;
  const memberCount = users.filter(u => !u.isAnonymous && u.membershipTier !== 'guest').length;
  const guestCount = users.filter(u => u.isAnonymous || u.membershipTier === 'guest').length;
  const pushEnabledCount = users.filter(u => u.fcmTokenCount > 0).length;

  // 검색 및 필터링 적용
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query || 
      String(user.id).includes(query) ||
      (user.firebaseUid && user.firebaseUid.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.displayName && user.displayName.toLowerCase().includes(query));

    const matchesTier = 
      selectedTierFilter === 'all' || 
      (selectedTierFilter === 'guest' && (user.isAnonymous || user.membershipTier === 'guest')) ||
      user.membershipTier === selectedTierFilter;

    return matchesSearch && matchesTier;
  });

  const getTierBadge = (user: UserItem) => {
    const tier = user.membershipTier || (user.isAnonymous ? 'guest' : 'free');
    switch (tier) {
      case 'pro':
        return <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1"><Sparkles className="w-3 h-3" /> PRO</span>;
      case 'beta_trial':
        return <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> BETA 체험</span>;
      case 'trial_30':
      case 'trial':
        return <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> 30일 체험</span>;
      case 'free':
        return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-medium">FREE</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-medium">GUEST</span>;
    }
  };

  const formatDateStr = (dateVal: string | Date | null) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                <UsersIcon className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">회원 관리 콘솔</h1>
            </div>
            <p className="text-slate-400 text-xs md:text-sm">
              서비스 가입 회원 정보를 상세 조회하고, 등급 변경 및 개별 체험 시작일/종료일을 제어합니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이메일, 닉네임, ID 검색..." 
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
            </div>

            {/* Tier Filter Dropdown */}
            <select
              value={selectedTierFilter}
              onChange={(e) => setSelectedTierFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">전체 등급 보기</option>
              <option value="member">정회원 전체</option>
              <option value="guest">게스트 (guest)</option>
              <option value="free">FREE (무료 회원)</option>
              <option value="beta_trial">Beta 체험 (beta_trial)</option>
              <option value="trial_30">30일 체험 (trial_30)</option>
              <option value="pro">PRO (유료 회원)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>총 등록 사용자</span>
            <UsersIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalCount} <span className="text-xs font-normal text-slate-400">명</span></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>정회원 (로그인 유저)</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{memberCount} <span className="text-xs font-normal text-slate-400">명</span></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>게스트 (비회원 유저)</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-300">{guestCount} <span className="text-xs font-normal text-slate-400">명</span></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>푸시 연동 기기 유저</span>
            <Bell className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{pushEnabledCount} <span className="text-xs font-normal text-slate-400">명</span></div>
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <span>회원 데이터 목록을 불러오는 중입니다...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-2">
            <UsersIcon className="w-10 h-10 mx-auto text-slate-600 mb-1" />
            <p className="font-semibold text-slate-300">조회된 회원이 없습니다.</p>
            <p className="text-xs text-slate-500">검색어나 필터 조건을 변경해 보세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">회원 정보 (이메일 / 닉네임)</th>
                  <th className="py-3.5 px-4">회원 등급</th>
                  <th className="py-3.5 px-4">언어 / 푸시</th>
                  <th className="py-3.5 px-4">개별 체험 시작일</th>
                  <th className="py-3.5 px-4">개별 체험 종료일</th>
                  <th className="py-3.5 px-4">가입일</th>
                  <th className="py-3.5 px-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{u.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {u.email || (u.displayName ? u.displayName : '게스트 (익명)')}
                      </div>
                      {u.displayName && u.email && (
                        <div className="text-[11px] text-slate-400 font-medium">{u.displayName}</div>
                      )}
                      {u.firebaseUid && (
                        <div 
                          className="text-[10px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer flex items-center gap-1 mt-0.5"
                          title="클릭하여 UID 복사"
                          onClick={() => {
                            navigator.clipboard.writeText(u.firebaseUid || '');
                            alert('UID가 클립보드에 복사되었습니다.');
                          }}
                        >
                          <Copy className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{u.firebaseUid}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getTierBadge(u)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-mono text-[11px]">
                          <Globe className="w-3 h-3 text-indigo-400" />
                          {u.language || 'ko'}
                        </span>
                        {u.fcmTokenCount > 0 ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <Bell className="w-3 h-3" /> {u.fcmTokenCount}대
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">미수신</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{formatDateStr(u.trialStartsAt)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{formatDateStr(u.trialEndsAt)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{formatDateStr(u.createdAt)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold transition-all flex items-center gap-1.5 ml-auto"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        정보/기간 수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">회원 정보 & 체험기간 개별 설정</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUserInfo} className="space-y-4 text-xs">
              {modalMsg && (
                <div className={`p-3 rounded-xl flex items-center gap-2 border ${
                  modalMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}>
                  {modalMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{modalMsg.text}</span>
                </div>
              )}

              {/* Target User Info Summary */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 font-medium">
                  <span>대상 회원 (ID: {editingUser.id})</span>
                  <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-mono">
                    <Globe className="w-3 h-3 text-indigo-400" />
                    {editingUser.language === 'en' ? 'English (en)' : '한국어 (ko)'}
                  </span>
                </div>
                <div className="text-white font-bold text-sm">
                  {editingUser.email || '게스트 (이메일 없음)'}
                </div>
                {editingUser.firebaseUid && (
                  <div 
                    className="text-[11px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1 pt-1 border-t border-slate-800/60"
                    onClick={() => {
                      navigator.clipboard.writeText(editingUser.firebaseUid || '');
                      alert('Firebase UID가 클립보드에 복사되었습니다.');
                    }}
                  >
                    <Copy className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="truncate">UID: {editingUser.firebaseUid}</span>
                  </div>
                )}
              </div>

              {/* Display Name Edit */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">
                  닉네임 / 표시 이름 (displayName)
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Language Select (CS Support & Exception handling) */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>수신/설정 언어 (Language)</span>
                  <span className="text-[11px] text-slate-500 font-normal">* CS 지원 등 필요 시 수동 변경 가능</span>
                </label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="ko">한국어 (ko)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>

              {/* Membership Tier Select */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">
                  회원 등급 선택 (membershipTier)
                </label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="guest">게스트 (guest) - 비회원</option>
                  <option value="free">FREE (free) - 일반 무료 회원</option>
                  <option value="beta_trial">Beta 체험 (beta_trial) - 글로벌/개별 체험</option>
                  <option value="trial_30">30일 체험 (trial_30) - 개인 30일 체험</option>
                  <option value="pro">PRO (pro) - 정기 결제 유료 회원</option>
                </select>
              </div>

              {/* Trial Start Date */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>체험 개별 시작일 (trialStartsAt)</span>
                  <span className="text-[11px] text-slate-500 font-normal">* 지정 시 이 날짜부터 PRO 혜택 시작</span>
                </label>
                <input
                  type="datetime-local"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Trial End Date */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>체험 개별 종료일 (trialEndsAt)</span>
                  <span className="text-[11px] text-slate-500 font-normal">* 지정 시 이 날짜 지나면 PRO 혜택 만료</span>
                </label>
                <input
                  type="datetime-local"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>변경사항 저장하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
