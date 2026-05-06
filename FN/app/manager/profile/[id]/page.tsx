'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Award, Briefcase, FileText, User, ChevronLeft, ShieldCheck, HeartHandshake, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { managerApi } from '@/src/api/index'; // 방금 추가한 API 임포트

interface ManagerProfile {
  id: number;
  name: string;
  certifications: string;
  career: string;
  introduction: string;
  averageRating: number;
  reviewCount: number;
}

export default function ManagerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const managerId = Number(params.id);

  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    managerApi.getManagerProfile(managerId)
      .then(res => setProfile(res.data))
      .catch(err => {
        console.error("프로필 로딩 실패", err);
        alert("매니저 정보를 불러오지 못했습니다.");
        router.back();
      })
      .finally(() => setIsLoading(false));
  }, [managerId, router]);

  // 자격증명 포맷팅 헬퍼 함수
  const formatLicense = (license: string) => {
    switch(license) {
      case 'caregiver': return '요양보호사';
      case 'socialworker': return '사회복지사';
      case 'nurse': return '간호사/간호조무사';
      case 'none': return '자체 전문교육 수료';
      default: return license || '전문 동행 매니저';
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>;
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      {/* 1. 상단 블루 헤더 (프로필 명함 배경) */}
      <section className="bg-gradient-to-b from-blue-950 to-blue-900 pt-10 pb-32 px-6 relative">
        <div className="max-w-3xl mx-auto relative z-10">
          <button onClick={() => router.back()} className="flex items-center text-blue-200 hover:text-white transition-colors mb-6 font-medium">
            <ChevronLeft className="w-5 h-5 mr-1" /> 돌아가기
          </button>
        </div>
      </section>

      {/* 2. 메인 프로필 카드 영역 */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 -mt-24 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 sm:p-10 mb-8"
        >
          {/* 상단: 사진 및 기본 정보 */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 border-b border-gray-100 pb-8">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-blue-50 rounded-full border-4 border-white shadow-md flex items-center justify-center text-blue-300 flex-shrink-0">
              <User className="w-16 h-16" />
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold mb-3 border border-emerald-100">
                <ShieldCheck className="w-4 h-4" /> 신원 검증 완료
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{profile.name} <span className="text-xl font-semibold text-gray-400">매니저</span></h2>
              
              {/* 평점 및 리뷰 수 */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold text-gray-800">{profile.averageRating > 0 ? profile.averageRating.toFixed(1) : '신규'}</span>
                <span className="text-gray-400 text-sm ml-1">(리뷰 {profile.reviewCount}개)</span>
              </div>
            </div>
          </div>

          {/* 하단: 상세 정보 (자격, 경력, 소개) */}
          <div className="space-y-8">
            {/* 자격증 정보 */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
                <Award className="w-5 h-5 text-blue-600" /> 보유 자격 및 교육
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl text-gray-700 font-medium">
                {formatLicense(profile.certifications)}
              </div>
            </div>

            {/* 경력 사항 */}
            {profile.career && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
                  <Briefcase className="w-5 h-5 text-blue-600" /> 주요 경력
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {profile.career}
                </div>
              </div>
            )}

            {/* 자기 소개 (지원 동기 활용) */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
                <HeartHandshake className="w-5 h-5 text-emerald-500" /> 매니저의 한마디
              </h3>
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 relative">
                <FileText className="absolute top-4 right-4 w-12 h-12 text-blue-100 opacity-50 pointer-events-none" />
                <p className="text-gray-700 leading-loose whitespace-pre-wrap italic text-sm sm:text-base relative z-10">
                  "{profile.introduction || '환자분과 보호자님의 마음까지 따뜻하게 살피는 동행이 되겠습니다.'}"
                </p>
              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}