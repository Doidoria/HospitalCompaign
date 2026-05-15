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
    if (response.data && typeof response.data.success !== 'undefined') {
      if (response.data.success) {
        response.data = response.data.data;
      } else {
        return Promise.reject(new Error(response.data.error || 'API 요청 실패'));
      }
    }
    return response;
  },
  (error) => {
    // 에러가 난 API 주소가 무엇인지 확인합니다.
    const originalRequestUrl = error.config?.url;

    if (error.response?.status === 401) {
      // 로그인 API(/api/members/login 등)에서 터진 401 에러가 "아닐 때만" 만료 처리!
      if (originalRequestUrl && !originalRequestUrl.includes('/login')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          if (!isAlertOpen) {
            isAlertOpen = true;
            alert('로그인이 만료되었습니다. 다시 로그인해 주세요.');
            window.location.href = '/login';
          }
        }
      }
    }
    
    // 에러를 그대로 통과시켜서 LoginPage의 catch 블록이 잡을 수 있게 해줍니다.
    return Promise.reject(error);
  }
);