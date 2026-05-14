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
  getManagerAppStatus: () => apiClient.get('/api/members/me/manager-application'),
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
  submitReview: (id: number, data: { rating: number; comment: string }) => 
    apiClient.post(`/api/reservations/${id}/reviews`, data),
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
  getPendingManagers: (status: string = 'WAITING') => 
    apiClient.get(`/api/members/manager-applications?status=${status}`),
  approveManager: (memberId: number) => apiClient.patch(`/api/members/${memberId}/approve`),
  rejectManager: (applicationId: number) => apiClient.delete(`/api/members/manager-applications/${applicationId}`),
  getManagerCount: () => apiClient.get('/api/members/managers/count'),
  rejectManagerApp: (id: number, data: { rejectionReason: string }) => 
    apiClient.post(`/api/members/manager-applications/${id}/reject`, data),

  // 전체 회원 조회
  getAllMembers: (page: number = 0, role?: string) => 
    apiClient.get(`/api/members/all?page=${page}${role ? `&role=${role}` : ''}`),
  
  // 예약 상태 및 키워드 검색
  searchReservations: (keyword: string, status?: string, page: number = 0) => {
    let url = `/api/reservations/search?page=${page}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    if (status) url += `&status=${status}`;
    return apiClient.get(url);
  },

  // 리뷰 및 리포트 모니터링
  getAllReviews: (page: number = 0) => apiClient.get(`/api/reservations/reviews/all?page=${page}`),
  deleteReview: (reviewId: number) => apiClient.delete(`/api/reservations/reviews/${reviewId}`),
  
  // 계정 상태 업데이트 (status: true면 정지 해제, false면 정지)
  updateMemberStatus: (memberId: number, activate: boolean) => 
    apiClient.patch(`/api/members/${memberId}/status`, { activate }),
    
  changeMemberRole: (memberId: number, role: string) => 
    apiClient.patch(`/api/members/${memberId}/role`, { role }),

  // 매니저 강제 배정/취소
  assignManager: (reservationId: number, managerEmail: string) => 
    apiClient.patch(`/api/reservations/${reservationId}/assign`, { managerEmail }),
    
  cancelAssignManager: (reservationId: number) => 
    apiClient.patch(`/api/reservations/${reservationId}/cancel-assign`),

  // 전체 1:1 문의 내역 조회 (페이징 및 상태 필터링)
  getAllInquiries: (page: number = 0, status?: string) => {
    let url = `/api/admin/inquiries?page=${page}`;
    if (status) url += `&status=${status}`;
    return apiClient.get(url);
  },
  // 1:1 문의에 답변 달기 및 상태 변경
  answerInquiry: (inquiryId: number, answer: string) =>
    apiClient.patch(`/api/admin/inquiries/${inquiryId}/answer`, { answer }),

  // 공지사항 관리
  getAllNotices: (page: number = 0) => apiClient.get(`/api/admin/notices?page=${page}`),
  createNotice: (data: { title: string; content: string; important: boolean }) => 
    apiClient.post('/api/admin/notices', data),
  updateNotice: (id: number, data: { title: string; content: string; important: boolean }) => 
    apiClient.put(`/api/admin/notices/${id}`, data),
  deleteNotice: (id: number) => apiClient.delete(`/api/admin/notices/${id}`),
};

export const managerApi = {
  // 매니저 상세 프로필 정보 가져오기
  getManagerProfile: (managerId: number) => 
    apiClient.get(`/api/managers/${managerId}/profile`),

  // 2. 매니저가 자신의 프로필을 수정/저장
  updateManagerProfile: (data: { introduction: string; career: string; certifications: string }) => 
    apiClient.put(`/api/managers/profile`, data),
};

// ==========================================
// 리뷰 (review)
// ==========================================
export const reviewApi = {
  // 리뷰 목록 조회
  getReviews: (page = 0, size = 10) => 
    apiClient.get(`/api/reviews?page=${page}&size=${size}`),

  // 리뷰 작성 (URL에 reservationId 포함)
  createReview: (reservationId: number, data: { rating: number; comment: string }) => 
    apiClient.post(`/api/reviews/${reservationId}`, data),
};

export const categoryApi = {
  // 서비스 카테고리 전체 목록 조회
  getAll: () => apiClient.get('/api/categories'), 
};

// ==========================================
// 공지사항 (notice)
// ==========================================
export const noticeApi = {
  // 일반 유저용 공지사항 목록 조회
  getNotices: (page: number = 0) => apiClient.get(`/api/notices?page=${page}`),

  // 일반 유저용 공지사항 단건 상세 조회
  getNotice: (id: number) => apiClient.get(`/api/notices/${id}`),
};

// ==========================================
// 1:1 문의 (Inquiry)
// ==========================================
export const inquiryApi = {
  submitInquiry: (formData: FormData) => 
    apiClient.post('/api/inquiries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // 내 문의 내역 가져오기
  getMyInquiries: () => apiClient.get('/api/inquiries/me'),

  // 상세 조회
  getInquiry: (id: number) => apiClient.get(`/api/inquiries/${id}`),

  // 비밀글 비밀번호 확인 API
  checkPassword: (id: number, password: string) => 
    apiClient.post(`/api/inquiries/${id}/check-password`, { password }),
};