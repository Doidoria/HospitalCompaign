import { apiClient } from './client';

// ==========================================
// 1. Auth & Users (인증/회원)
// ==========================================
export const authApi = {  
  // 1. 로그인 (성공 시 토큰 발급)
  login: (data: any) => apiClient.post('/api/members/login', data),  
  
  // 2. 회원가입
  signup: (data: any) => apiClient.post('/api/members/join', data),
  
  // 3. 내 예약 목록 가져오기 (마이페이지 기능)
  getMe: () => apiClient.get('/api/members/me'),
  checkEmail: (email: string) => apiClient.get(`/api/members/check-email?email=${email}`),
  sendSms: (phone: string) => apiClient.post('/api/members/sms/send', { phone }),
  verifySms: (phone: string, code: string) => apiClient.post('/api/members/sms/verify', { phone, code }),
  verifyPassword: (password: string) => apiClient.post('/api/members/verify-password', { password }),
  changePassword: (newPassword: string) => apiClient.put('/api/members/password', { newPassword }),
  updateMe: (data: any) => apiClient.put('/api/members/me', data),
};

// ==========================================
// 2. Reservations (동행 예약)
// ==========================================
export const reservationApi = {
  create: (data: any) => apiClient.post('/api/reservations', data),
  getMyList: () => apiClient.get('/api/reservations/me'),
  getAll: (page: number = 0, size: number = 10) => 
    apiClient.get(`/api/reservations?page=${page}&size=${size}`),
  
  // 예약 상태 변경 (PATCH /api/reservations/{id}/status)
  updateStatus: (id: number, status: string) => 
    apiClient.patch(`/api/reservations/${id}/status`, { status }),
  accept: (id: number) => apiClient.patch(`/api/reservations/${id}/accept`),
  getDetail: (id: string) => apiClient.get(`/api/reservations/${id}`),
  cancel: (id: string) => apiClient.delete(`/api/reservations/${id}`),
  update: (id: string, data: any) => apiClient.put(`/api/reservations/${id}`, data),
  getWaiting: () => apiClient.get('/api/reservations/waiting'),
  getManagerSchedules: () => apiClient.get('/api/reservations/manager/me'),
  createProxy: (id: number, data: any) => apiClient.post(`/api/reservations/${id}/proxy`, data),
};

// ==========================================
// 3. Reports (케어 리포트)
// ==========================================
export const reportApi = {
  create: (data: any) => apiClient.post('/api/reports', data),
  getDetail: (reservationId: string) => apiClient.get(`/api/reports/reservation/${reservationId}`), 
  createWithPdf: (formData: FormData) => apiClient.post('/api/reports', formData),
};

// ==========================================
// 4. Admin (최고 관리자)
// ==========================================
export const adminApi = {
  getReservations: (page: number) => reservationApi.getAll(page),
  getPendingManagers: () => apiClient.get('/api/members/manager-applications'),
  approveManager: (memberId: number) => apiClient.patch(`/api/members/${memberId}/approve`),
  rejectManager: (applicationId: number) => apiClient.delete(`/api/members/manager-applications/${applicationId}`),
  getManagerCount: () => apiClient.get('/api/members/managers/count'),
};

export const categoryApi = {
  // 서비스 카테고리 전체 목록 조회
  getAll: () => apiClient.get('/api/categories'), 
};