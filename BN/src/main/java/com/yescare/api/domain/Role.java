package com.yescare.api.domain;

public enum Role {
    USER,       // 일반 보호자/환자
    MANAGER_PRO,  // 예스케어 소속 매니저 (기존 교육 수료)
    MANAGER_FREE, // 프리랜서 매니저 (직접 지원)
    ADMIN       // 최고 관리자
}