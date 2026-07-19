package com.yescare.api.service;

import com.yescare.api.repository.EducationApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EducationService {

    private final EducationApplicationRepository educationApplicationRepository;
    private final com.yescare.api.repository.MemberRepository memberRepository;

    // 대기 중인 교육 신청 건수 반환
    public long getPendingCount() {
        return educationApplicationRepository.countByStatus("WAITING");
    }

    // 클래스 맨 아래에 아래 메서드 추가
    public java.util.Map<String, String> getMyEducationStatus(String email) {
        com.yescare.api.domain.Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));

        return educationApplicationRepository.findTopByMemberOrderByAppliedAtDesc(member)
                .map(app -> {
                    java.util.Map<String, String> map = new java.util.HashMap<>();
                    map.put("status", app.getStatus());
                    map.put("courseType", app.getCourseType());
                    map.put("rejectionReason", app.getRejectionReason() != null ? app.getRejectionReason() : "");
                    return map;
                })
                .orElseGet(() -> {
                    java.util.Map<String, String> map = new java.util.HashMap<>();
                    map.put("status", "NONE");
                    return map;
                });
    }

    // 전체 교육 신청 내역 최신순 조회
    public java.util.List<com.yescare.api.domain.EducationApplication> getAllEducations() {
        // JpaRepository의 기본 findAll 사용 후 정렬하거나, Repository에 메서드 추가 없이 기본 지원되는 findAll 사용 가능
        return educationApplicationRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "appliedAt"));
    }

    // 관리자 승인/거절 상태 변경
    @Transactional
    public void updateStatus(Long id, String status, String rejectionReason) {
        com.yescare.api.domain.EducationApplication app = educationApplicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 신청 내역이 없습니다."));

        app.updateStatus(status);

        // 동적 반려 사유 처리
        if ("REJECTED".equals(status)) {
            String finalReason = (rejectionReason != null && !rejectionReason.trim().isEmpty())
                    ? rejectionReason
                    : "정원 초과 또는 요건 미달로 반려되었습니다.";
            app.reject(finalReason);
        }
    }

    // 일반 사용자가 교육 신청 폼 제출 시 DB 인서트 처리
    @Transactional
    public void applyEducation(String email, String courseType) {
        com.yescare.api.domain.Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));

        com.yescare.api.domain.EducationApplication application = com.yescare.api.domain.EducationApplication.builder()
                .member(member)
                .courseType(courseType)
                .build();

        educationApplicationRepository.save(application);
    }
}