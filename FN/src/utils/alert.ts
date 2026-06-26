// src/utils/alert.ts
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import 'animate.css';
import { useAlertStore } from '@/src/store/useAlertStore';

// 우측 상단 토스트 알림
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500, // 2.5초
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-2xl shadow-lg border border-slate-100 bg-white py-3 px-4',
    title: 'text-sm font-bold text-slate-800',
    timerProgressBar: 'bg-blue-500',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export const YesAlert = {
  fire: async (arg1: any, arg2?: string, arg3?: string) => {
    // 만약 첫 번째 인자가 문자열이면 (예: YesAlert.fire('제목', '내용', 'error'))
    const options = typeof arg1 === 'string' 
      ? { title: arg1, html: arg2, icon: arg3 } 
      : arg1; // 첫 번째 인자가 객체면 그대로 사용

    return await useAlertStore.getState().fire(options);
  }
};

export const MySwal = withReactContent(Swal);