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

// 2. 응답 인터셉터
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
    
    return response;
  },
  (error) => {
    const originalRequestUrl = error.config?.url;

    // 백엔드가 내려준 JSON 에러 메시지를 가로채서 프론트엔드 기본 error.message로 강제 덮어쓰기
    if (error.response?.data) {
      const resData = error.response.data;
      if (typeof resData === 'object' && resData.message) {
        error.message = resData.message; // 예: {"message": "가입되지 않은 이메일입니다."} 
      } else if (typeof resData === 'string') {
        try {
          const parsed = JSON.parse(resData);
          if (parsed.message) error.message = parsed.message;
        } catch (e) {
          error.message = resData;
        }
      }
    }

    // 만약 점검중 상태인데 일반 유저가 API를 호출해 에러가 났다면 점검 페이지로 리다이렉트
    if (error.response?.status === 503 || error.message?.includes("점검")) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
        window.location.href = '/maintenance';
      }
    }

    if (error.response?.status === 401 && originalRequestUrl && !originalRequestUrl.includes('/login')) {
      if (typeof window !== 'undefined') {
        // 로컬스토리지 삭제 + 브라우저 쿠키 강제 만료(삭제) 동시 진행
        localStorage.removeItem('accessToken'); 
        document.cookie = 'accessToken=; path=/; max-age=0;'; 
        
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