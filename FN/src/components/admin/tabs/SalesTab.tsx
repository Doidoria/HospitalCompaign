'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { adminApi } from '@/src/api';
import { 
  TrendingUp, CreditCard, Banknote, CalendarCheck, Loader2, Download
} from 'lucide-react';
import { Toast } from '@/src/utils/alert';
import EmptyState from '../ui/EmptyState';

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

// 숫자를 원 단위 콤마 포맷으로 변환하는 헬퍼 함수
const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원';

export default function SalesTab() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('MONTH'); // MONTH, WEEK, YEAR
  
  // 상태 모음 (실제로는 백엔드 API 연동 필요)
  const [summary, setSummary] = useState({ totalSales: 0, totalBaseFee: 0, totalExtraFee: 0, totalCompletedCount: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [salesDetails, setSalesDetails] = useState<any[]>([]);

  // 1. 임시 데이터 로딩 로직 (백엔드 연동 전 UI 확인용)
  // SalesTab.tsx 내부
  
  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        // 1. 더미 데이터(setTimeout) 삭제 후 실제 API 호출
        const res = await adminApi.getSalesStatistics(period);
        
        // 2. 백엔드(ApiResponse)에서 내려주는 data 추출
        const data = res.data; 

        // 3. State 업데이트
        setSummary(data.summary);
        setChartData(data.chartData);
        setSalesDetails(data.salesDetails);
        
      } catch (error) {
        console.error('매출 데이터 로딩 에러:', error);
        // 에러 발생 시 초기화 (옵션)
        setSummary({ totalSales: 0, totalBaseFee: 0, totalExtraFee: 0, totalCompletedCount: 0 });
        setChartData([]);
        setSalesDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [period]); // period(월/주/년)가 바뀔 때마다 API 다시 호출

  const exportSalesToCsv = (data: any[]) => {
    if (data.length === 0) {
      Toast.fire({ icon: 'warning', title: '다운로드할 데이터가 없습니다.' });
      return;
    }

    // 1. 엑셀 헤더 정의
    const headers = ['예약번호', '서비스일자', '환자명', '매니저명', '선입금(기본요금)', '추가요금', '최종매출합계'];

    // 2. 데이터 행 생성
    const rows = data.map(item => [
      item.id,
      item.date,
      `"${item.patientName}"`,
      `"${item.managerName}"`,
      item.baseFee,
      item.extraFee,
      item.totalFee
    ]);

    // 3. CSV 문자열 병합 및 한글 깨짐 방지(BOM)
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 4. 강제 다운로드 트리거
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `예스케어_매출상세내역_${today}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 상단 요약 카드 데이터
  const statsCards = useMemo(() => [
    { title: '총 매출액', value: formatCurrency(summary.totalSales), icon: <TrendingUp className="w-6 h-6 text-blue-500" /> },
    { title: '선입금 (기본요금)', value: formatCurrency(summary.totalBaseFee), icon: <CreditCard className="w-6 h-6 text-indigo-500" /> },
    { title: '추가 매출 (할증 등)', value: formatCurrency(summary.totalExtraFee), icon: <Banknote className="w-6 h-6 text-emerald-500" /> },
    { title: '이용 완료 건수', value: `${summary.totalCompletedCount}건`, icon: <CalendarCheck className="w-6 h-6 text-orange-500" /> },
  ], [summary]);

  return (
    <>
      {/* 1. 요약 통계 카드 */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        {statsCards.map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants} 
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">{stat.icon}</div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">{stat.title}</p>
              <p className="text-xl font-black text-slate-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* 2. 매출 추이 차트 영역 */}
      <motion.div variants={tabVariants} initial="hidden" animate="visible" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">기간별 매출 추이</h2>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)} 
            className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="WEEK">최근 1주일</option>
            <option value="MONTH">이번 달</option>
            <option value="YEAR">올해</option>
          </select>
        </div>
        
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `${value.toLocaleString()}`} />
                <Tooltip cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                <Bar dataKey="baseFee" name="선입금(기본요금)" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="extraFee" name="추가요금" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* 3. 매출 상세 내역 테이블 */}
      <motion.div variants={tabVariants} initial="hidden" animate="visible" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">건별 매출 상세 내역 (완료 기준)</h2>
          <button onClick={() => exportSalesToCsv(salesDetails)} 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">엑셀 다운로드</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/90 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold pl-6">예약번호</th>
                <th className="p-4 font-bold">서비스 일자</th>
                <th className="p-4 font-bold">환자 / 매니저</th>
                <th className="p-4 font-bold text-right">선입금(기본)</th>
                <th className="p-4 font-bold text-right">추가 요금</th>
                <th className="p-4 font-bold text-right pr-6">최종 매출 합계</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {loading ? (
                <tr><td colSpan={6} className="p-16 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></td></tr>
              ) : salesDetails.length > 0 ? salesDetails.map((res) => (
                <tr key={res.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-slate-400 font-medium">#{res.id}</td>
                  <td className="p-4 font-semibold text-slate-800">{res.date}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{res.patientName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">담당: {res.managerName}</p>
                  </td>
                  <td className="p-4 text-right font-medium text-slate-600">{formatCurrency(res.baseFee)}</td>
                  <td className="p-4 text-right font-medium text-emerald-600">{res.extraFee > 0 ? `+ ${formatCurrency(res.extraFee)}` : '-'}</td>
                  <td className="p-4 pr-6 text-right font-black text-blue-600">{formatCurrency(res.totalFee)}</td>
                </tr>
              )) : (
                <EmptyState message="조회된 매출 내역이 없습니다." colSpan={6} isTable={true} />
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}