package com.yescare.api.service;

import com.yescare.api.domain.*;
import com.yescare.api.dto.*;
import com.yescare.api.repository.ManagerApplicationRepository;
import com.yescare.api.repository.ManagerRepository;
import com.yescare.api.repository.MemberRepository;
import com.yescare.api.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerService {

    private final MemberRepository memberRepository;
    private final ManagerRepository managerRepository;
    private final ManagerApplicationRepository managerApplicationRepository;
    private final ReviewRepository reviewRepository;

    @Transactional
    public void saveManagerApplication(ManagerApplyRequest request, String email, String certificateUrl) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        if (member.getRole() == Role.MANAGER || member.getRole() == Role.ADMIN) {
            throw new IllegalStateException("이미 매니저 권한이 있습니다.");
        }

        String daysString = request.getAvailableDays() != null ? String.join(",", request.getAvailableDays()) : "협의";
        Optional<ManagerApplication> existingApp = managerApplicationRepository.findByMember(member);

        if (existingApp.isPresent()) {
            ManagerApplication app = existingApp.get();
            if ("WAITING".equals(app.getStatus())) {
                throw new IllegalStateException("이미 심사 대기 중인 지원서가 있습니다.");
            } else if ("REJECTED".equals(app.getStatus())) {
                app.updateApplication(request.getLicenseName(), request.getExperience(), request.getMotivation(), certificateUrl, daysString, request.getAvailableTime());
                return;
            }
        }

        ManagerApplication application = ManagerApplication.builder()
                .member(member).licenseName(request.getLicenseName())
                .experience(request.getExperience()).motivation(request.getMotivation())
                .certificateUrl(certificateUrl).availableDays(daysString).availableTime(request.getAvailableTime())
                .build();
        managerApplicationRepository.save(application);
    }

    @Transactional
    public void rejectManagerApplication(Long applicationId, String reason) {
        ManagerApplication app = managerApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("지원서를 찾을 수 없습니다."));
        app.reject(reason);
    }

    @Transactional(readOnly = true)
    public List<ManagerAppResponse> getPendingManagerApplications() {
        return managerApplicationRepository.findByStatus("WAITING").stream()
                .map(ManagerAppResponse::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, String> getManagerApplicationStatus(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        if (member.getRole() == Role.MANAGER) {
            return Map.of("status", "APPROVED", "title", "매니저 승인 완료", "description", "축하합니다! 매니저 자격이 최종 승인되었습니다.");
        }

        Optional<ManagerApplication> appOpt = managerApplicationRepository.findByMember(member);
        if (appOpt.isPresent()) {
            ManagerApplication app = appOpt.get();
            if ("REJECTED".equals(app.getStatus())) {
                return Map.of("status", "REJECTED", "title", "매니저 신청 반려", "description", "아쉽게도 이번 신청이 반려되었습니다.", "rejectionReason", app.getRejectionReason() != null ? app.getRejectionReason() : "사유 미기재");
            }
            return Map.of("status", "WAITING", "title", "승인 대기 중", "description", "매니저 신청이 접수되어 검토 중입니다.");
        }
        return Map.of("status", "NONE", "title", "신청 내역 없음", "description", "아직 매니저 지원 내역이 없습니다.");
    }

    @Transactional(readOnly = true)
    public long getActiveManagerCount() {
        return memberRepository.countByRole(Role.MANAGER);
    }

    @Transactional
    public String approveManager(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        member.approveManager();

        managerApplicationRepository.findByMember(member).ifPresent(app -> {
            app.approve();
            if (managerRepository.findByMemberId(member.getId()).isEmpty()) {
                Manager newManager = new Manager(member, app.getMotivation(), app.getExperience(), app.getLicenseName());
                managerRepository.save(newManager);
            }
        });
        return member.getName() + " 님이 매니저로 승인되었습니다.";
    }

    @Transactional
    public void updateManagerProfile(String email, ManagerProfileUpdateRequest request) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        Manager manager = managerRepository.findByMemberId(member.getId())
                .orElseThrow(() -> new IllegalArgumentException("매니저 프로필 정보가 존재하지 않습니다."));

        manager.updateProfile(request.getIntroduction(), request.getCareer(), request.getCertifications());
    }

    @Transactional(readOnly = true)
    public ManagerProfileResponse getManagerProfile(Long managerId) {
        Member managerMember = memberRepository.findById(managerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매니저입니다."));

        Manager manager = managerRepository.findByMemberId(managerId)
                .orElse(new Manager(managerMember, "인사말이 없습니다.", "경력 정보가 없습니다.", "자격증 정보 없음"));

        List<Review> reviews = reviewRepository.findByReservation_ManagerId(managerId);
        double averageRating = reviews.isEmpty() ? 0.0 : reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);

        return new ManagerProfileResponse(manager); // 이전에 만든 생성자 사용
    }
}