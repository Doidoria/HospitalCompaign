// src/api/auth.ts
import { apiClient } from './client';

export const authApi = {
  // 카카오 인가 코드를 백엔드로 보내서 JWT를 받아오는 함수
  loginWithKakao: async (code: string) => {
    const response = await apiClient.post('/api/members/auth/kakao', { code });
    return response.data;
  },
};