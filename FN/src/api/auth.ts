// src/api/auth.ts
import { apiClient } from './client';

export const authApi = {
  // 카카오 인가 코드를 백엔드로 보내서 JWT를 받아오는 함수
  loginWithKakao: async (code: string) => {
    const response = await apiClient.post('/api/members/auth/kakao', { code });
    
    // 백엔드 응답에서 토큰을 추출해 두 저장소에 동기화
    // (response.data의 실제 키값 구조에 맞게 매핑)
    const token = response.data.accessToken || response.data; 

    if (token && typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
      
      const isProd = process.env.NODE_ENV === 'production';
      document.cookie = `accessToken=${token}; path=/; max-age=604800; SameSite=Lax${isProd ? '; Secure' : ''}`;
    }
    
    return response.data;
  },
};