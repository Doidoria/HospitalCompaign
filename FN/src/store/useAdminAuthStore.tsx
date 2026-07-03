import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AdminAuthStore {
  isLocked: boolean;
  pendingAction: (() => void) | null;
  lock: () => void;
  unlock: () => void;
  requestPinAuth: (action: () => void) => void;
  clearPendingAction: () => void;
}

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set) => ({
      isLocked: true, // 초기 상태
      pendingAction: null,
      
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false, pendingAction: null }),
      
      requestPinAuth: (action) => set({ isLocked: true, pendingAction: action }),
      clearPendingAction: () => set({ pendingAction: null }),
    }),
    {
      name: 'admin-pin-storage', // 브라우저 스토리지에 저장될 키 이름
      storage: createJSONStorage(() => sessionStorage), // 로컬스토리지 대신 세션스토리지 사용(탭 닫으면 초기화)
      
      // 보안상 pendingAction(함수)은 스토리지에 저장하면 에러가 나므로 isLocked 상태만 저장
      partialize: (state) => ({ isLocked: state.isLocked }), 
    }
  )
);