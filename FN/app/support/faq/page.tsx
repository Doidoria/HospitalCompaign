// app/support/faq/page.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { inquiryApi, noticeApi } from '@/src/api/index';
import { PhoneCall } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { 
  ChevronDown, MessageCircleQuestion, Bell, Headphones, Search, ChevronLeft, 
  ChevronRight, PenSquare, Lock
} from 'lucide-react';
import { Toast, YesAlert } from '@/src/utils/alert'; 
import Link from 'next/link';

const faqs = [
  { q: "예약 취소 수수료는 어떻게 되나요?", a: "서비스 시작 24시간 전까지는 100% 무료 취소가 가능합니다. 12시간 전 취소 시 50% 수수료가 부과됩니다." },
  { q: "매니저 교체가 가능한가요?", a: "네, 가능합니다. 고객센터(053-982-2778)로 연락주시면 다음 예약 시 반영해 드립니다." },
  { q: "어떤 병원이든 동행이 가능한가요?", a: "현재 수도권 내에 있는 대학병원, 종합병원, 일반 의원 모두 동행 가능합니다." },
  { q: "환자가 휠체어를 타야 하는데 가능한가요?", a: "예약 시 '거동 상태'에 체크해 주시면 휠체어 보조에 능숙한 매니저가 배정됩니다." },
  { q: "결제는 언제 이루어지나요?", a: "서비스 매칭이 완료된 후, 마이페이지에서 카드 또는 계좌이체로 선결제해주셔야 합니다." },
  { q: "동행 중 식사 시간은 어떻게 처리되나요?", a: "식사 시간도 서비스 이용 시간에 포함되며, 매니저의 식대는 고객님께서 부담하지 않으셔도 됩니다." },
];

type TabType = 'faq' | 'notice' | 'inquiry';
type InquiryStatusType = 'PENDING' | 'ANSWERED';

interface InquiryType {
  id: number;
  title: string;
  status: InquiryStatusType;
  date: string;
  isPrivate: boolean;
}

export default function CustomerSupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [myInquiries, setMyInquiries] = useState<InquiryType[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'notice' || tab === 'inquiry' || tab === 'faq') {
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'inquiry') {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        Toast.fire({
          icon: 'warning',
          title: '로그인이 필요한 서비스입니다.',
          timer: 1500,
        });
        setTimeout(() => {
          router.push('/login'); 
        }, 500); 
        
        return; 
      }

      const fetchMyInquiries = async () => {
        try {
          const response = await inquiryApi.getMyInquiries();

          const formattedData = response.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            date: item.createdAt ? item.createdAt.substring(0, 10).replace(/-/g, '.') : '날짜 없음',
            isPrivate: item.private
          }));
          
          setMyInquiries(formattedData);
        } catch (error) {
          console.error("문의 내역을 불러오는 데 실패했습니다.", error);
          // 에러 발생 시 토스트 알림
          Toast.fire({ icon: 'error', title: '문의 내역을 불러오지 못했습니다.' });
        }
      };
      
      fetchMyInquiries();
    }
  }, [activeTab]);

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const res = await noticeApi.getNotices();
        setNotices(res.data.content);
      } catch (e) { 
        console.error("공지 로드 실패", e); 
      }
    };
    loadNotices();
  }, []);

  const isNewNotice = (dateString: string) => {
    if (!dateString) return false;
    const noticeDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - noticeDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };
  
  const itemsPerPage = 5;

  const filteredData = useMemo(() => {
    let targetData = activeTab === 'faq' ? faqs : activeTab === 'notice' ? notices : [];
    
    if (searchQuery) {
      if (activeTab === 'faq') {
        targetData = (targetData as typeof faqs).filter(item => item.q.includes(searchQuery) || item.a.includes(searchQuery));
      } else if (activeTab === 'notice') {
        targetData = (targetData as typeof notices).filter(item => item.title.includes(searchQuery));
      }
    }
    return targetData;
  }, [activeTab, searchQuery, notices]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setOpenIndex(null);
    setSearchQuery('');
  };

  // 비밀글 비밀번호 확인 핸들러
  const handleCheckPassword = async (id: number) => {
    const { value: password } = await YesAlert.fire({
      title: '비밀번호 확인',
      input: 'password',
      html: '<p class="text-sm text-slate-500 mb-2">이 문의글을 작성할 때 설정한<br/>비밀번호를 입력해주세요.</p>',
      inputPlaceholder: '비밀번호 입력',
      showCancelButton: true,
      confirmButtonText: '확인',
      cancelButtonText: '취소',
      customClass: {
        popup: 'bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-4 md:p-6',
        title: 'text-xl font-bold text-slate-800',
        confirmButton: 'bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/30',
        cancelButton: 'bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all',
        actions: 'flex gap-3 mt-6',
        input: 'rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest' // 인풋창 스타일링
      },
      buttonsStyling: false,
      inputValidator: (value: string) => {
        if (!value) return '비밀번호를 입력해야 합니다!';
      }
    });

    if (password) {
      try {
        await inquiryApi.checkPassword(id, password); 
        router.push(`/support/inquiry/${id}`);
      } catch (error) {
        YesAlert.fire({
          icon: 'error',
          title: '인증 실패',
          html: '비밀번호가 일치하지 않습니다.<br/>다시 확인해 주세요.'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-4xl">
        {/* 상단 타이틀 & 검색 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 px-4">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-950 mb-2">고객센터</h1>
            <p className="text-gray-500 font-medium">무엇을 도와드릴까요? 예스케어가 함께합니다.</p>
          </div>
          <div className="relative">
            <input type="text" value={searchQuery} onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); 
              }}
              placeholder="검색어를 입력하세요"
              className="w-full md:w-80 pl-11 pr-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm transition-all"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex p-1.5 bg-gray-200/50 rounded-2xl mb-8 mx-4">
          {(['faq', 'notice', 'inquiry'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'faq' && '자주 묻는 질문'}
              {tab === 'notice' && '공지사항'}
              {tab === 'inquiry' && '1:1 문의'}
            </button>
          ))}
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 md:p-10 min-h-[500px] flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'faq' && (
              <motion.div key="faq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 flex-1">
                <div className="flex items-center gap-2 mb-4 text-blue-900 font-bold">
                  <MessageCircleQuestion className="w-5 h-5" /> FAQ
                </div>
                {currentData.length === 0 ? (
                   <p className="text-center text-gray-400 py-10">검색 결과가 없습니다.</p>
                ) : (
                  (currentData as typeof faqs).map((faq, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden bg-white hover:border-blue-100 transition-colors">
                      <button onClick={() => setOpenIndex(openIndex === idx ? null : idx)} className="w-full flex justify-between items-center p-5 text-left focus:outline-none">
                        <span className="font-bold text-gray-800 flex gap-3 text-base md:text-lg">
                          <span className="text-blue-600">Q.</span> {faq.q}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
                      </button>
                      {openIndex === idx && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-5 pb-5 pt-2 text-gray-600 border-t border-dashed border-gray-100 bg-blue-50/20">
                          <span className="font-bold text-blue-600 mr-2">A.</span> {faq.a}
                        </motion.div>
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'notice' && (
              <motion.div key="notice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1">
                <div className="flex items-center gap-2 mb-6 text-blue-900 font-bold">
                  <Bell className="w-5 h-5" /> 공지사항
                </div>
                <div className="divide-y divide-gray-100">
                  {currentData.length === 0 ? (
                     <p className="text-center text-gray-400 py-10">검색 결과가 없습니다.</p>
                  ) : (
                    (currentData as typeof notices).map((notice) => (
                      <div key={notice.id} onClick={() => router.push(`/support/notice/${notice.id}`)}
                        className="py-4 flex items-center justify-between group cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-xl transition-colors">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {notice.important && <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">중요</span>}
                            {isNewNotice(notice.createdAt) && <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>}
                            <span className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{notice.title}</span>
                          </div>
                          <span className="text-sm text-gray-400">{notice.createdAt?.substring(0, 10) || notice.date}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* 문의 탭 UI 분기 처리 */}
            {activeTab === 'inquiry' && (
              <motion.div key="inquiry" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1">
                
                {myInquiries.length === 0 ? (
                  // 내역이 없을 때 (기존 큰 버튼 화면)
                  <div className="text-center py-10">
                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Headphones className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">궁금한 점이 있으신가요?</h3>
                    <p className="text-gray-500 mb-8">전문 상담원이 친절하게 답변해 드립니다.</p>
                    <Link href="/support/inquiry">
                      <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg">
                        <PenSquare className="w-5 h-5" /> 1:1 문의하기
                      </button>
                    </Link>
                  </div>
                ) : (
                  // 내역이 있을 때 (리스트 + 별도 문의하기 버튼)
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-blue-950 flex items-center gap-2">
                        <Headphones className="w-5 h-5" /> 나의 문의 내역
                      </h3>
                      <Link href="/support/inquiry">
                        <button className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                          <PenSquare className="w-4 h-4" /> 새 문의하기
                        </button>
                      </Link>
                    </div>

                    <div className="divide-y divide-gray-100 border-t">
                      {myInquiries.map((inq) => (
                        <div key={inq.id} onClick={() => {
                            if (inq.isPrivate) {
                              handleCheckPassword(inq.id); 
                            } else {
                              router.push(`/support/inquiry/${inq.id}`);
                            }
                          }} className="py-4 flex justify-between items-center group cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-xl transition-colors">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inq.status === 'ANSWERED' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                                {inq.status === 'ANSWERED' ? '답변완료' : '접수완료'}
                              </span>
                              <span className="font-semibold text-gray-800 flex items-center gap-1">
                                {inq.isPrivate && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                                {inq.title}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 pl-1">{inq.date}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 페이지네이션 */}
          {activeTab !== 'inquiry' && totalPages > 1 && (
            <div className="mt-auto pt-10 flex justify-center items-center gap-4">
              <button 
                className="p-2 border rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors" 
                disabled={currentPage === 1} 
                onClick={() => { setCurrentPage(prev => prev - 1); setOpenIndex(null); }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button 
                    key={n} 
                    onClick={() => { setCurrentPage(n); setOpenIndex(null); }} 
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === n ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button 
                className="p-2 border rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors" 
                disabled={currentPage === totalPages}
                onClick={() => { setCurrentPage(prev => prev + 1); setOpenIndex(null); }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        {/* 하단 고객센터 배너 */}
        <div className="mt-12 relative overflow-hidden bg-gradient-to-br from-blue-900 to-blue-950 rounded-[32px] text-white 
            shadow-xl shadow-blue-900/10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-center gap-5 z-10 w-full md:w-auto text-center md:text-left">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
              <PhoneCall className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <p className="text-blue-200 font-medium mb-1 text-sm">도움이 필요하시면 언제든 전화주세요</p>
              <p className="font-extrabold text-3xl tracking-tight text-white">053-982-2778</p>
            </div>
          </div>

          <div className="z-10 flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
            <div className="text-sm text-blue-200/80 text-center md:text-right font-medium leading-relaxed">
              평일 09:30 ~ 17:30 (점심시간 12:00 ~ 13:00)<br />
              <span className="text-blue-300/80">주말 및 공휴일 휴무</span>
            </div>
            
            <a href="tel:053-982-2778" className="md:hidden w-full py-3.5 bg-white text-blue-950 rounded-xl font-bold text-center shadow-md active:scale-[0.98] transition-transform">
              바로 전화걸기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}