import axios from 'axios';

// 1. 기본 인스턴스 생성
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420', 
  },
  withCredentials: true, // 쿠키 기반 세션/CORS 처리 시 필요
});

// 2. 요청(Request) 인터셉터: 모든 API 요청 직전에 실행됨
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 3. 응답(Response) 인터셉터: 데이터 정제 및 공통 에러 처리
let isAlertOpen = false; 

apiClient.interceptors.response.use(
  (response) => {
    // 백엔드의 ApiResponse 껍데기를 자동으로 벗겨줌
    if (response.data && typeof response.data.success !== 'undefined') {
      if (response.data.success) {
        // 껍데기 버리고 알맹이(data)만 남겨서 컴포넌트로 전달
        response.data = response.data.data;
      } else {
        // 백엔드에서 success: false 로 보낸 경우 강제로 에러 발생시킴
        return Promise.reject(new Error(response.data.error || 'API 요청 실패'));
      }
    }
    return response;
  },
  (error) => {
    // 기존 401(인증 만료) 에러 처리 로직
    if (error.response?.status === 401) {
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