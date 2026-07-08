// src/store/useAlertStore.ts
import { create } from 'zustand';

interface AlertOptions {
  title?: string;
  text?: string;
  html?: string;
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  input?: 'textarea' | 'text' | 'number' | 'email' | 'password';
  inputValue?: string | number;
  inputValidator?: (value: string) => string | null;
}

interface AlertStore extends AlertOptions {
  isOpen: boolean;
  resolve: ((value: any) => void) | null;
  fire: (options: AlertOptions) => Promise<any>;
  close: (result: any) => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  isOpen: false,
  resolve: null,
  
  // YesAlert.fire() 가 호출되면 Promise를 멈춰두고 모달을 엽니다.
  fire: (options) => {
    return new Promise((resolve) => {
      set({ ...options, isOpen: true, resolve });
    });
  },
  
  // 사용자가 버튼을 누르면 멈춰둔 Promise에 값을 담아 해제합니다.
  close: (result) => {
    const { resolve } = get();
    if (resolve) resolve(result);
    set({ 
      isOpen: false, 
      resolve: null, 
      title: '', 
      text: '',
      html: '',
      icon: undefined,
      showCancelButton: false,      // 이전 팝업의 취소 버튼 노출 여부 초기화
      confirmButtonText: undefined, // 이전 팝업의 '탈퇴 진행' 텍스트 초기화
      cancelButtonText: undefined,  // 이전 팝업의 취소 텍스트 초기화 
      input: undefined, 
      inputValidator: undefined 
    });
  }
}));