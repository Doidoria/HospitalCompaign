import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-16 px-6 mt-auto text-sm border-t border-gray-800 relative z-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
        <div className="space-y-1.5">
          <p className="font-bold text-white text-lg">예스케어 <span className="text-gray-400 font-medium text-sm">| 병원동행서비스</span></p>
          <div className="flex justify-center md:justify-start gap-4 text-xs font-medium">
            <a href="/terms" className="hover:text-white transition-colors">이용약관</a>
            <a href="/privacy" className="text-gray-300 hover:text-white transition-colors font-bold">개인정보처리방침</a>
            <a href="/support/faq" className="hover:text-white transition-colors">고객센터(FAQ)</a>
          </div>
          <p>고객센터 : 1588-0000 | 이메일 : help@yescare.com</p>
        </div>
        <div className="text-xs text-gray-500 md:text-right space-y-1.5">
          <p>© 2026 Ye'sCare. All rights reserved.</p>
          <p>대구광역시 중구 남산 1동 | 사업자등록번호 : 123-45-67890</p>
        </div>
      </div>
    </footer>
  );
}