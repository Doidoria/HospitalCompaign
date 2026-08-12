'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { adminApi } from '@/src/api';
import { 
  TrendingUp, CreditCard, Banknote, CalendarCheck, Loader2, Download, Search, User, CalendarDays, Edit, 
  AlertCircle, CheckCircle2, RotateCcw, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { SalesSummary, DailySalesData, SalesDetail, Member, SalesTabProps, ManagerSettlement } from '@/src/types/sales';
import { Toast, YesAlert } from '@/src/utils/alert';
import EmptyState from '../ui/EmptyState';
import Swal from 'sweetalert2';

const containerVariants: Variants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};
const itemVariants: Variants = { 
  hidden: { opacity: 0, y: 10 }, 
  visible: { opacity: 1, y: 0 } 
};
const tabVariants: Variants = { 
  hidden: { opacity: 0, y: 15 }, 
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } 
};

// 숫자를 원 단위 콤마 포맷으로 변환
const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value || 0) + '원';

// 메인 컴포넌트
export default function SalesTab({ members, handleViewMemberProfile }: SalesTabProps) {
  const [loading, setLoading] = useState(true);
  
  // 검색 및 필터 상태
  const [period, setPeriod] = useState('MONTH'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'COMPLETED'>('ALL'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // 데이터 상태
  const [summary, setSummary] = useState<SalesSummary>({ totalSales: 0, totalBaseFee: 0, totalExtraFee: 0, totalCompletedCount: 0 });
  const [chartData, setChartData] = useState<DailySalesData[]>([]);
  const [salesDetails, setSalesDetails] = useState<SalesDetail[]>([]);
  const [customManagerSettlements, setCustomManagerSettlements] = useState<ManagerSettlement[]>([]);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customLoading, setCustomLoading] = useState(false);

  // 매니저 70% 배분 후 8.8% 세금 공제 로직으로 변경
  const calculateSettlement = (totalFee: number) => {
    const managerShare = Math.floor(totalFee * 0.7); // 70% 배분
    const taxAmount = Math.floor(managerShare * 0.088); // 8.8% 세금 공제
    return managerShare - taxAmount; // 최종 실지급액
  };

  // API Fetching 로직
  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSalesStatistics(period, searchTerm, null, null);
      const data = res.data; 

      setSummary(data.summary);
      setChartData(data.chartData);
      setSalesDetails(data.salesDetails);
      setCurrentPage(1);
    } catch (error) {
      console.error('매출 데이터 로딩 에러:', error);
      setSummary({ totalSales: 0, totalBaseFee: 0, totalExtraFee: 0, totalCompletedCount: 0 });
      setChartData([]);
      setSalesDetails([]);
    } finally {
      setLoading(false);
    }
  }, [period, searchTerm]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => fetchSalesData(), 400);
    return () => clearTimeout(delayDebounce);
  }, [fetchSalesData]);

  // 커스텀 기간 정산 조회
  const fetchCustomSettlements = async () => {
    if (!customStart || !customEnd) {
      Toast.fire({ icon: 'warning', title: '시작일과 종료일을 모두 선택해주세요.' });
      return;
    }
    setCustomLoading(true);
    try {
      const res = await adminApi.getSalesStatistics('CUSTOM', '', customStart, customEnd);
      setCustomManagerSettlements(res.data.managerSettlements || []);
    } catch (error) {
      Toast.fire({ icon: 'error', title: '정산액 조회에 실패했습니다.' });
    } finally {
      setCustomLoading(false);
    }
  };

  // 액션 핸들러
  const onViewManager = (managerName: string) => {
    const managerInfo = members?.find(m => m.name === managerName && m.role.includes('MANAGER'));
    if (managerInfo) {
      handleViewMemberProfile(managerInfo);
    } else {
      Toast.fire({ icon: 'warning', title: '매니저 상세 정보를 찾을 수 없습니다.' });
    }
  };

  // 금액 수정
  const handleEditAmount = async (reservationId: number, currentExtraFee: number) => {
    const { isConfirmed, value: newAmount } = await YesAlert.fire({
      title: '추가 요금 조정',
      html: '수정할 추가 요금을 입력해 주세요.<br/>(음수 입력 시 환불/할인 처리)',
      icon: 'question',
      input: 'number',
      inputValue: currentExtraFee,
      showCancelButton: true,
      confirmButtonText: '저장하기',
      cancelButtonText: '닫기',
    });

    if (isConfirmed && newAmount !== undefined && newAmount !== null) {
      try {
        await adminApi.updateExtraFee(reservationId, Number(newAmount));
        Toast.fire({ icon: 'success', title: '금액이 성공적으로 수정되었습니다.' });
        fetchSalesData();
      } catch (error) {
        YesAlert.fire({ icon: 'error', title: '오류', text: '금액 수정에 실패했습니다.' });
      }
    }
  };

  // 전체 환불 처리 핸들러 (기본금 포함 전체 0원 처리)
  const handleRefundAll = async (reservationId: number, patientName: string) => {
    const confirm = await YesAlert.fire({
      title: '전체 환불 처리',
      html: `정말 <strong>[${patientName}]</strong> 환자의 예약을 전체 환불 처리하시겠습니까?<br/>확인 시 기본 요금과 추가 요금이 모두 <strong>0원</strong>으로 변경됩니다.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '네, 환불합니다',
      cancelButtonText: '취소',
      confirmButtonColor: '#EF4444', // 위험 경고용 빨간색 버튼
      cancelButtonColor: '#94A3B8'
    });

    if (confirm.isConfirmed) {
      try {
        await adminApi.refundAllSales(reservationId);
        Toast.fire({ icon: 'success', title: '전체 환불 및 0원 처리가 완료되었습니다.' });
        fetchSalesData(); // 테이블 리프레시
      } catch (error) {
        YesAlert.fire({ icon: 'error', title: '오류', text: '환불 처리에 실패했습니다.' });
      }
    }
  };

  const handleToggleSettlement = async (reservationId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'READY' ? 'COMPLETED' : 'READY';
    const confirmMsg = nextStatus === 'COMPLETED' ? '정산 완료 처리하시겠습니까?' : '정산 대기 상태로 변경하시겠습니까?';
    
    const confirm = await YesAlert.fire({
      title: '정산 상태 변경',
      text: confirmMsg,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '변경',
      cancelButtonText: '취소'
    });

    if (confirm.isConfirmed) {
      try {
        await adminApi.updateSettlementStatus(reservationId, nextStatus);
        
        // 프론트엔드 화면 즉시 갱신 (DB 새로고침 없이 빠른 UI 반영)
        setSalesDetails(prevDetails => 
          prevDetails.map(item => 
            item.id === reservationId ? { ...item, settlementStatus: nextStatus } : item
          )
        );

        Toast.fire({ icon: 'success', title: '정산 상태가 변경되었습니다.' });
      } catch (error) {
        YesAlert.fire({ icon: 'error', title: '오류', text: '상태 변경에 실패했습니다.' });
      }
    }
  };

  const exportSalesToCsv = () => {
    if (salesDetails.length === 0) {
      Toast.fire({ icon: 'warning', title: '다운로드할 데이터가 없습니다.' });
      return;
    }

    const headers = ['예약번호', '서비스일자', '환자명', '매니저명', '선입금(기본요금)', '추가요금', '최종매출합계', '실지급액(세후)', '정산상태'];

    const rows = salesDetails.map(item => [
      item.id, item.date, `"${item.patientName}"`, `"${item.managerName}"`,
      item.baseFee, item.extraFee, item.totalFee, calculateSettlement(item.totalFee),
      item.settlementStatus === 'COMPLETED' ? '정산완료' : '정산대기'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `예스케어_매출정산내역_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingSettlementTotal = useMemo(() => {
    return salesDetails
      .filter(item => item.settlementStatus !== 'COMPLETED')
      .reduce((sum, item) => sum + calculateSettlement(item.totalFee), 0);
  }, [salesDetails]);

  const statsCards = useMemo(() => [
    { title: '총 매출액', value: formatCurrency(summary.totalSales), icon: <TrendingUp className="w-6 h-6 text-blue-500" /> },
    { title: '선입금 (기본요금)', value: formatCurrency(summary.totalBaseFee), icon: <CreditCard className="w-6 h-6 text-indigo-500" /> },
    { 
      title: '미지급 정산 대기액', 
      value: formatCurrency(pendingSettlementTotal), 
      icon: <Banknote className="w-6 h-6 text-rose-500" /> 
    },
    { title: '이용 완료 건수', value: `${summary.totalCompletedCount}건`, icon: <CalendarCheck className="w-6 h-6 text-orange-500" /> },
  ], [summary, pendingSettlementTotal]);

  const filteredSalesDetails = useMemo(() => {
    if (statusFilter === 'ALL') return salesDetails;
    return salesDetails.filter(item => (item.settlementStatus || 'READY') === statusFilter);
  }, [salesDetails, statusFilter]);

  // 페이지네이션 적용된 리스트 (최종적으로 화면에 그릴 10개)
  const totalPages = Math.ceil(filteredSalesDetails.length / itemsPerPage);
  const currentSalesDetails = filteredSalesDetails.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 페이지 이동 함수
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <>
      {/* 1. 요약 통계 카드 */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        {statsCards.map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants} 
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-3 lg:gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0">{stat.icon}</div>
            <div>
              <p className="text-[11px] lg:text-xs font-bold text-slate-400 mb-0.5">{stat.title}</p>
              <p className="text-lg lg:text-xl font-black text-slate-800 break-all">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* 2. 매출 추이 차트 영역 */}
      <motion.div variants={tabVariants} initial="hidden" animate="visible" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-6">기간별 매출 추이</h2>
        <div className="h-[250px] lg:h-[300px] w-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `${value.toLocaleString()}`} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [formatCurrency(Number(value)), '']} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                <Bar dataKey="baseFee" name="기본요금" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="extraFee" name="추가요금" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* 3. 매출 정산 장부 */}
      <motion.div variants={tabVariants} initial="hidden" animate="visible" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
        {/* 헤더 및 필터 */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 shrink-0">매출 및 매니저 정산 장부</h2>
            
            {/* 정산 상태 필터링 버튼 */}
            <div className="hidden sm:flex bg-slate-200/50 p-1 rounded-lg">
              <button onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>전체</button>
              <button onClick={() => { setStatusFilter('READY'); setCurrentPage(1); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statusFilter === 'READY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>정산 대기</button>
              <button onClick={() => { setStatusFilter('COMPLETED'); setCurrentPage(1); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statusFilter === 'COMPLETED' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>입금 완료</button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center w-full lg:w-auto gap-2">
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 py-2.5 px-3 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
              <option value="TODAY">오늘</option>
              <option value="WEEK">최근 1주일</option>
              <option value="MONTH">이번 달</option>
              <option value="YEAR">올해</option>
              <option value="ALL">전체 기간</option>
            </select>
            <div className="relative flex-1 sm:w-56">
              <input type="text" placeholder="환자명/매니저명 검색" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 shadow-sm" />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button onClick={exportSalesToCsv} className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm">
              <Download className="w-4 h-4" /> <span className="sm:inline">엑셀 다운로드</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
        ) : salesDetails.length === 0 ? (
          <EmptyState message="조회된 매출 내역이 없습니다." isTable={false} />
        ) : (
          <>
            {/* 3-A. PC 뷰: 넙적한 테이블 */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-slate-50/90 text-slate-500 text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold pl-6">예약 정보</th>
                    <th className="p-4 font-bold">환자 / 매니저</th>
                    <th className="p-4 font-bold text-right">총 결제금액 (기본+추가)</th>
                    <th className="p-4 font-bold text-right text-indigo-600 bg-indigo-50/30">실지급액
                      <span className="block text-[10px] font-normal text-indigo-400 mt-0.5">(70% 배분 - 8.8% 세금)</span>
                    </th>
                    <th className="p-4 font-bold text-center pr-6">정산 관리</th>
                  </tr>
                </thead>
                <tbody className="text-sm bg-white">
                  {currentSalesDetails.map((res) => (
                    <tr key={res.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-all ${
                      res.settlementStatus === 'COMPLETED' ? 'opacity-40 bg-slate-200 grayscale-[30%] select-none' : ''}`}>
                      <td className="p-4 pl-6">
                        <span className="text-slate-400 font-medium text-xs block mb-1">#{res.id}</span>
                        <span className="font-semibold text-slate-800">{res.date}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{res.patientName}</p>
                        <button onClick={() => onViewManager(res.managerName)} className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1 hover:underline cursor-pointer">
                          <User className="w-3.5 h-3.5" /> 담당: {res.managerName}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-black text-slate-800 text-base">{formatCurrency(res.totalFee)}</span>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>(기본 {formatCurrency(res.baseFee)}</span>
                            <span className="text-emerald-600 font-medium">+추가 {formatCurrency(res.extraFee)})</span>
                            <button onClick={() => handleEditAmount(res.id, res.extraFee)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-500" title="금액 수정">
                              <Edit className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleRefundAll(res.id, res.patientName)} className="p-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-500 transition-colors" title="전체 환불(0원 처리)">
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-black text-indigo-600 bg-indigo-50/20 text-base">
                        {formatCurrency(calculateSettlement(res.totalFee))}
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <button onClick={() => handleToggleSettlement(res.id, res.settlementStatus || 'READY')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border
                            ${(!res.settlementStatus || res.settlementStatus === 'READY') ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}
                        >
                          {(!res.settlementStatus || res.settlementStatus === 'READY') ? <><AlertCircle className="w-3.5 h-3.5" /> 정산 대기</> : <><CheckCircle2 className="w-3.5 h-3.5" /> 입금 완료</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3-B. 모바일/태블릿 뷰: 카드형 리스트 */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/50 border-t border-slate-100">
              {currentSalesDetails.map((res) => (
                <div key={res.id} className={`p-4 rounded-[20px] border shadow-sm flex flex-col gap-3 transition-all ${
                  res.settlementStatus === 'COMPLETED' 
                    ? 'bg-slate-200 border-slate-300 opacity-40 grayscale-[30%]' 
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-bold text-xs">#{res.id}</span>
                    <span className="font-bold text-slate-800 text-sm">{res.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="font-extrabold text-slate-800 text-base">{res.patientName}</p>
                    <button onClick={() => onViewManager(res.managerName)} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg flex items-center gap-1">
                      <User className="w-3 h-3" /> {res.managerName}
                    </button>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-2.5 text-sm border border-slate-100">
                    <div className="flex justify-between text-slate-500">
                      <span className="font-semibold text-xs">기본 요금</span> 
                      <span className="font-medium">{formatCurrency(res.baseFee)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span className="font-semibold text-xs">추가 요금</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">+{formatCurrency(res.extraFee)}</span>
                        <button onClick={() => handleEditAmount(res.id, res.extraFee)} className="p-1 bg-white border border-emerald-200 rounded text-emerald-600 shadow-sm">
                          <Edit className="w-3 h-3"/>
                        </button>
                        <button onClick={() => handleRefundAll(res.id, res.patientName)} className="p-1 bg-white border border-red-200 rounded text-red-500 shadow-sm transition-colors">
                          <RotateCcw className="w-3 h-3"/>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between font-black text-slate-800 border-t border-slate-200 pt-2.5 mt-0.5">
                      <span>총 결제금액</span> <span className="text-base text-blue-600">{formatCurrency(res.totalFee)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-indigo-400 mb-0.5">실지급액 (세후)</span>
                      <span className="text-sm font-black text-indigo-600">{formatCurrency(calculateSettlement(res.totalFee))}</span>
                    </div>
                    <button onClick={() => handleToggleSettlement(res.id, res.settlementStatus || 'READY')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border
                        ${(!res.settlementStatus || res.settlementStatus === 'READY') ? 'bg-white text-slate-600 border-slate-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}
                    >
                      {(!res.settlementStatus || res.settlementStatus === 'READY') ? '정산 대기' : '입금 완료'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
              <span className="text-sm text-slate-500 font-medium">
                총 <span className="font-bold text-slate-800">{filteredSalesDetails.length}</span>건 중 
                <span className="font-bold text-slate-800 ml-1">{(currentPage - 1) * itemsPerPage + 1}</span>-
                <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredSalesDetails.length)}</span>
              </span>
              
              <div className="flex items-center gap-1">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} 
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button key={num} onClick={() => paginate(num)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                        currentPage === num ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      {num}
                    </button>
                  ))}
                </div>

                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </motion.div>

      {/* 4. 매니저별 커스텀 기간 정산 총합 조회 카드 */}
      <motion.div variants={tabVariants} initial="hidden" animate="visible" className="bg-indigo-50/50 rounded-2xl shadow-sm border border-indigo-100 p-5 lg:p-6 mt-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 border-b border-indigo-100 pb-5 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-indigo-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-500" /> 커스텀 기간 정산액 산출
            </h2>
            <p className="text-xs text-indigo-600/80 mt-1.5 font-medium break-keep">
              원하는 날짜를 지정하여 기간 내 매니저들의 총 정산액을 확인하세요.
            </p>
          </div>
          
          {/* 날짜 선택 및 조회 영역 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} 
              className="flex-1 lg:flex-none w-full lg:w-auto bg-white border border-indigo-200 text-sm font-semibold text-slate-700 py-2.5 px-3 rounded-xl focus:ring-2 focus:ring-indigo-400 shadow-sm" />
            <span className="hidden sm:block text-indigo-300 font-bold text-center">~</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} 
              className="flex-1 lg:flex-none w-full lg:w-auto bg-white border border-indigo-200 text-sm font-semibold text-slate-700 py-2.5 px-3 rounded-xl focus:ring-2 focus:ring-indigo-400 shadow-sm" />
            <button onClick={fetchCustomSettlements} 
              className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md shadow-indigo-200 transition-colors mt-2 sm:mt-0">
              조회하기
            </button>
          </div>
        </div>

        {customLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : customManagerSettlements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customManagerSettlements.map((manager, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex justify-between items-center hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-lg border border-indigo-100">
                    {(manager.managerName || '-').charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{manager.managerName}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{manager.matchCount}건 활동 완료</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-indigo-400 font-bold mb-0.5">지급 정산액</p>
                  <p className="font-black text-indigo-600 text-lg">{formatCurrency(manager.totalSettlementAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-indigo-200 py-10 text-center text-indigo-400 text-sm font-bold flex flex-col items-center gap-2">
            <CalendarDays className="w-8 h-8 text-indigo-200 mb-1" />
            기간을 설정하고 조회 버튼을 누르시면 매니저별 정산액이 표시됩니다.
          </div>
        )}
      </motion.div>
    </>
  );
}