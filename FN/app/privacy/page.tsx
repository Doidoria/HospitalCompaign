import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-14">
        <h1 className="text-3xl font-extrabold text-blue-950 mb-8">개인정보처리방침</h1>
        
        <div className="text-gray-700 text-sm md:text-base space-y-6 leading-relaxed">
          <p>예스케어는 고객님의 개인정보를 매우 중요하게 생각하며, 「개인정보보호법」을 준수하고 있습니다.</p>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. 수집하는 개인정보 항목</h2>
            <p>회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>필수항목:</strong> 이름, 연락처, 이메일, 비밀번호, 서비스 이용지 주소</li>
              <li><strong>민감정보 (별도 동의 시):</strong> 기본 질환 정보, 복용 약물, 거동 상태 등 (안전한 동행 서비스를 위해 매니저에게 제한적으로 제공됨)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. 개인정보의 수집 및 이용 목적</h2>
            <p>수집된 개인정보는 병원 동행 매니저 매칭, 예약 관리, 긴급 상황 시 보호자 연락, 요금 결제 등의 목적으로만 이용됩니다.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. 개인정보의 파기 절차 및 방법</h2>
            <p>회원 탈퇴 시 또는 서비스 목적 달성 후, 회사는 해당 정보를 지체 없이 안전하게 파기합니다. 단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</p>
          </section>
        </div>
      </div>
    </div>
  );
}