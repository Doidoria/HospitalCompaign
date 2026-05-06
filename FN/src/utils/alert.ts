import Swal from 'sweetalert2';

// 예스케어 전용 알림창 (Tailwind CSS 적용)
export const YesAlert = Swal.mixin({
  customClass: {
    // 팝업 창 전체 컨테이너
    popup: 'rounded-[28px] shadow-2xl border border-gray-100 p-2',
    // 제목
    title: 'text-xl font-extrabold text-gray-800 mt-2',
    // 본문 내용
    htmlContainer: 'text-gray-500 text-sm mt-1 mb-2',
    // 확인 버튼 (에메랄드/블루 테마)
    confirmButton: 'w-full bg-blue-600 text-white px-6 py-3.5 rounded-[16px] font-bold hover:bg-blue-700 transition-colors shadow-sm',
    // 취소 버튼
    cancelButton: 'w-full bg-gray-100 text-gray-600 px-6 py-3.5 rounded-[16px] font-bold hover:bg-gray-200 transition-colors',
    // 버튼들을 감싸는 영역
    actions: 'w-full flex gap-2 px-4 pb-2'
  },
  buttonsStyling: false, // 기본 투박한 버튼 스타일 강제 제거
  backdrop: 'rgba(255, 255, 255, 0.6) backdrop-blur-sm', // 반투명 블러 배경 (고급스러운 느낌)
  showClass: {
    popup: 'animate__animated animate__zoomIn animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__zoomOut animate__faster'
  }
});

// 사용 예시 (컴포넌트에서)
// import { YesAlert } from '@/src/utils/alert';
// YesAlert.fire({ icon: 'success', title: '성공', text: '완료되었습니다.' });