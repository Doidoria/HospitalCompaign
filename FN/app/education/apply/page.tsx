// app/education/apply/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, BookOpen, CheckCircle2, User, Phone, MapPin, Award, ShieldAlert, CalendarDays, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authApi, educationApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';
import Link from 'next/link';

export default function EducationApplyPage() {
  const router = useRouter();
  
  // 사용자 프로필 정보 바인딩용
  const [userInfo, setUserInfo] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    detailAddress: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // 선택된 교육 과정 상태 관리
  const [selectedCourse, setSelectedCourse] = useState('');
  // 정책 동의 여부
  const [isAgreed, setIsPolicyAgreed] = useState(false);

  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTime, setAvailableTime] = useState('');

  const DAYS = ['월', '화', '수', '목', '금', '토'];
  const toggleDay = (day: string) => {
    setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  // 내 정보 가져오기 및 자동 매핑
  useEffect(() => {
    authApi.getMe()
      .then(res => {
        setUserInfo({
          name: res.data.name || '',
          phoneNumber: res.data.phoneNumber || '',
          address: res.data.address || '',
          detailAddress: res.data.detailAddress || ''
        });
      })
      .catch(err => {
        console.error("사용자 정보를 불러올 수 없습니다:", err);
        Toast.fire({ icon: 'error', title: '로그인이 필요한 서비스입니다.' });
        router.push('/login');
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourse) {
      Toast.fire({ icon: 'warning', title: '원하시는 교육 과정을 선택해 주세요.' });
      return;
    }
    if (availableDays.length === 0) {
      Toast.fire({ icon: 'warning', title: '활동 가능 요일을 선택해 주세요.' });
      return;
    }
    if (!availableTime) {
      Toast.fire({ icon: 'warning', title: '활동 가능 시간을 선택해 주세요.' });
      return;
    }
    if (!isAgreed) {
      Toast.fire({ icon: 'warning', title: '필수 안내 및 이수 규정에 동의해 주세요.' });
      return;
    }

    const confirmResult = await YesAlert.fire({
      title: '교육 신청 확인',
      html: `<strong>[${selectedCourse}]</strong> 과정을 신청하시겠습니까?<br/>신청 시 관리자 승인 후 안내 문자가 발송됩니다.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1E3A8A',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: '네, 신청합니다',
      cancelButtonText: '취소'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      // 백엔드 통신
      await educationApi.create({
        courseType: selectedCourse,
        availableDays: availableDays.join(','),
        availableTime: availableTime
      });
      
      await YesAlert.fire({
        icon: 'success',
        title: '신청 완료',
        text: '예스케어 교육 과정 신청이 정상적으로 접수되었습니다.',
        confirmButtonColor: '#1E3A8A'
      });
      router.push('/mypage');
    } catch (error) {
      YesAlert.fire({
        icon: 'error',
        title: '신청 실패',
        text: '교육 신청 처리 중 에러가 발생했습니다. 다시 시도해 주세요.'
      });
    }
  };

  const courses = [
    { id: '자격증반', title: '병원동행 매니저 자격증반', desc: '이론 및 핵심 기초를 다지는 필수 자격 취득 과정' },
    { id: '심화반', title: '예스케어 전문 심화반', desc: '현장 실무, 특수 케어 및 응급 처치 집중 훈련 과정' },
    { id: '자격증+심화반', title: '자격증 + 심화 통합 마스터 패키지', desc: '기초 자격증부터 최고급 심화 과정까지 원스톱 패키지' }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-950"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      <main className="max-w-2xl mx-auto px-6 pt-12">
        
        {/* 상단 타이틀 래퍼 */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-10">
          <button onClick={() => router.push('/education')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">예스케어 교육 신청</h2>
        </motion.div>

        <motion.form onSubmit={handleSubmit} className="space-y-8" variants={containerVariants} initial="hidden" animate="visible" noValidate>
          
          {/* 1. 신청자 기본 인적사항 */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl"><User className="w-6 h-6 text-blue-600" /></div>
              1. 신청자 정보 확인
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100/50 flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <span className="block text-gray-400 text-xs font-semibold mb-0.5">성함</span>
                  <span className="font-bold text-gray-800">{userInfo.name}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100/50 flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <span className="block text-gray-400 text-xs font-semibold mb-0.5">연락처</span>
                  <span className="font-bold text-gray-800">{userInfo.phoneNumber}</span>
                </div>
              </div>
              <div className="sm:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100/50 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                <div>
                  <span className="block text-gray-400 text-xs font-semibold mb-0.5">등록된 주소지</span>
                  <span className="font-bold text-gray-800 leading-relaxed">
                    {userInfo.address} {userInfo.detailAddress}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-3 ml-1">
              * 개인정보 변경이 필요하신 경우 마이페이지 &gt; 회원정보 수정 탭에서 먼저 변경해 주세요.
            </p>
          </motion.div>

          {/* 2. 교육 과정 선택 섹션 */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl"><BookOpen className="w-6 h-6 text-emerald-600" /></div>
              2. 교육 과정 선택
            </h3>
            <div className="grid grid-cols-1 gap-3.5">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourse(course.id)}
                  className={`p-5 rounded-2xl font-bold text-left flex items-start justify-between border-2 transition-all group ${
                    selectedCourse === course.id 
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-md shadow-emerald-900/5' 
                      : 'border-gray-100 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <span className={`text-base block transition-colors ${selectedCourse === course.id ? 'text-emerald-800 font-extrabold' : 'text-gray-800'}`}>
                      {course.title}
                    </span>
                    <span className="text-xs text-gray-400 font-medium block leading-relaxed break-keep">
                      {course.desc}
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors mt-0.5 ${
                    selectedCourse === course.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-200 bg-white group-hover:border-gray-300'
                  }`}>
                    {selectedCourse === course.id && <Award className="w-3.5 h-3.5" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* 3. 활동 가능 요일 및 시간 */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl"><CalendarDays className="w-6 h-6 text-indigo-600" /></div>
              3. 활동 가능 요일 및 시간
            </h3>
            
            <div className="space-y-6">
              {/* 요일 선택 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">가능 요일 (다중 선택)</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-12 h-12 rounded-xl font-bold text-sm transition-all duration-200 border-2 ${
                        availableDays.includes(day)
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* 시간 선택 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <Clock className="w-4 h-4 text-indigo-500" /> 가능 시간대
                </label>
                <select
                  value={availableTime}
                  onChange={(e) => setAvailableTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-700"
                >
                  <option value="" disabled>활동 가능한 시간대를 선택해주세요</option>
                  <option value="오전 (09:00~13:00)">오전 (09:00~13:00)</option>
                  <option value="오후 (13:00~18:00)">오후 (13:00~18:00)</option>
                  <option value="종일 (09:00~18:00)">종일 (09:00~18:00)</option>
                  <option value="협의 가능">시간 협의 가능</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* 3. 동의 및 최종 완료 제출 버튼 */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-[24px] shadow-sm">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="education-policy"
                  checked={isAgreed}
                  onChange={(e) => setIsPolicyAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 sm:w-6 sm:h-6 accent-emerald-600 rounded-md border-gray-300 cursor-pointer shrink-0"
                />
                <div className="flex-1">
                  <label htmlFor="education-policy" className="text-[14px] sm:text-base font-extrabold text-slate-800 cursor-pointer block mb-1">
                    예스케어 교육 과정 안내 및 이수 규정에 동의합니다. <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[12px] sm:text-[13px] text-slate-500 font-medium break-keep leading-relaxed mb-2">
                    교육 신청 완료 후 단순 변심으로 인한 취소는 개강 3일 전까지만 가능하며, 출석률 90% 이상 수료 시에만 병원동행 매니저 활동 자격 매칭 대상자로 분류됨을 인지했습니다.
                  </p>
                  <Link href="/terms" target="_blank" className="inline-block text-[13px] font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4">
                    교육 수료 및 이수 약관 보기 ↗
                  </Link>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-950 text-white text-xl font-bold py-6 rounded-[24px] shadow-xl hover:bg-blue-900 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
              <CheckCircle2 className="w-7 h-7" /> 예스케어 교육 과정 신청하기
            </button>
          </motion.div>

        </motion.form>
      </main>
    </div>
  );
}