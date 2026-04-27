import axios from 'axios';

// 1. 기본 인스턴스 생성
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
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

// 3. 응답(Response) 인터셉터: 백엔드에서 에러를 보냈을 때 공통 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized 에러(토큰 만료 등) 발생 시 로그인 페이지로 강제 이동
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        alert('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      }
    }
    return Promise.reject(error);
  }
);