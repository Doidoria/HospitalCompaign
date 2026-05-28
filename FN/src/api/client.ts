// src/api/client.ts
import axios from 'axios';
import { ApiResponse, ErrorResponse } from '@/src/types/common'; 

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420', 
  },
  withCredentials: true,
});

// 1. 요청 인터셉터: 토큰 헤더 100% 보장 주입
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('accessToken');
      // 혹시라도 'undefined' 문자열이나 따옴표가 들어갔을 경우를 완벽히 방어
      if (token && token !== 'undefined' && token !== 'null') {
        token = token.replace(/['"]+/g, ''); // 따옴표 제거
        
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isAlertOpen = false; 

// 2. 응답 인터셉터: 🌟 개발자님의 원래 훌륭한 코드로 완전 원상 복구!
apiClient.interceptors.response.use(
  (response) => {
    const resData = response.data;

    // 백엔드의 공통 포맷 여부 확인
    if (resData && (resData.status !== undefined || resData.success !== undefined || resData.data !== undefined)) {
      if (resData.status === 'FAIL' || resData.success === false) {
        return Promise.reject(new Error(resData.error || resData.message || 'API 요청 실패'));
      }
      if (resData.data !== undefined) {
        response.data = resData.data; // 기존처럼 response 객체의 data만 교체!
      }
    }
    
    return response; // 🌟 핵심: 알맹이가 아닌 response 전체를 리턴!
  },
  (error) => {
    const originalRequestUrl = error.config?.url;

    if (error.response?.status === 401 && originalRequestUrl && !originalRequestUrl.includes('/login')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken'); 
        
        if (!isAlertOpen) {
          isAlertOpen = true;
          alert('로그인이 만료되었습니다. 다시 로그인해 주세요.');
          window.location.href = '/login'; 
        }
      }
    }
    
    return Promise.reject(error);
  }
);