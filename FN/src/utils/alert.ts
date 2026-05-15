// src/utils/alert.ts
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import 'animate.css';

// 예스케어 전용 알림창 (프리미엄 모던 UI 적용)
export const YesAlert = Swal.mixin({
  customClass: {
    // 팝업 창 전체: 여백(p-6)을 늘려 숨통을 틔우고 부드러운 그림자 적용
    popup: 'bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-4 md:p-6',
    
    // 제목: 색상을 살짝 부드러운 다크 그레이로 변경
    title: 'text-xl font-bold text-slate-800 mt-4',
    
    // 본문 내용: 자간(leading-relaxed)을 넓혀 가독성 향상
    htmlContainer: 'text-slate-500 text-sm mt-2 mb-6 leading-relaxed',
    
    // 확인 버튼: 5:5 비율(flex-1), 파란색 글로우 그림자
    confirmButton: 'flex-1 bg-blue-600 text-white px-5 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/30',
    
    // 취소 버튼: 5:5 비율(flex-1)
    cancelButton: 'flex-1 bg-slate-100 text-slate-600 px-5 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-all',
    
    // 버튼 컨테이너: 간격을 살짝 벌리고 위쪽 마진 제거
    actions: 'w-full flex gap-3 px-2 pb-2 mt-0'
  },
  buttonsStyling: false,
  // 배경: 흰색보다 살짝 어두운 톤의 블러가 훨씬 세련됨
  backdrop: 'rgba(15, 23, 42, 0.4) backdrop-blur-sm', 
  showClass: {
    // 튀어나오는 효과 대신 부드럽게 올라오는 효과
    popup: 'animate__animated animate__fadeInUp animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutDown animate__faster'
  }
});

// 우측 상단 토스트 알림 (UI 전면 개편)
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500, // 읽기 편하도록 2.5초로 살짝 증가
  timerProgressBar: true,
  customClass: {
    // 토스트 전용 테일윈드 디자인 추가
    popup: 'rounded-2xl shadow-lg border border-slate-100 bg-white py-3 px-4',
    title: 'text-sm font-bold text-slate-800',
    timerProgressBar: 'bg-blue-500',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export const MySwal = withReactContent(Swal);