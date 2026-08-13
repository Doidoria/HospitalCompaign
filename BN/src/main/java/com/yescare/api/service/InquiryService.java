package com.yescare.api.service;

import com.yescare.api.domain.Inquiry;
import com.yescare.api.domain.InquiryCategory;
import com.yescare.api.domain.InquiryStatus;
import com.yescare.api.domain.Member;
import com.yescare.api.dto.AdminInquiryResponse;
import com.yescare.api.dto.InquiryDetailResponse;
import com.yescare.api.dto.InquiryRequest;
import com.yescare.api.dto.InquiryResponse;
import com.yescare.api.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final KakaoAlimtalkService kakaoAlimtalkService;

    // 1:1 문의 전용 이미지 제한 용량 (5MB)
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    // 이미지 저장 로컬 경로 (프로젝트 루트 디렉토리 기준)
    private static final String UPLOAD_DIR = "uploads/inquiries/";

    @Transactional
    public Long saveInquiry(InquiryRequest request, Member member) {

        List<String> savedImageUrls = new ArrayList<>();

        // 1. 파일 유효성 검사 및 저장 로직
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            if (request.getImages().size() > 3) {
                throw new IllegalArgumentException("이미지는 최대 3장까지만 업로드 가능합니다.");
            }

            for (MultipartFile file : request.getImages()) {
                // 용량 체크 (5MB)
                if (file.getSize() > MAX_IMAGE_SIZE) {
                    throw new IllegalArgumentException("첨부 이미지는 5MB를 초과할 수 없습니다: " + file.getOriginalFilename());
                }
                // 확장자 체크
                if (!file.getContentType().startsWith("image/")) {
                    throw new IllegalArgumentException("이미지 파일만 첨부 가능합니다.");
                }

                // 파일 저장 및 URL(경로) 반환
                String imageUrl = fileStorageService.uploadFile(file, "inquiries");
                savedImageUrls.add(imageUrl);
            }
        }

        // 2. 비공개 설정 시 비밀번호 암호화
        String encodedPassword = null;
        if (request.isPrivate() && request.getPassword() != null && !request.getPassword().isEmpty()) {
            encodedPassword = passwordEncoder.encode(request.getPassword());
        }

        // 3. 엔티티 생성 및 DB 저장 (Inquiry 객체에 @Builder 패턴이 적용되어 있어야 합니다)
        Inquiry inquiry = Inquiry.builder()
                .member(member)
                .category(InquiryCategory.valueOf(request.getCategory()))
                .title(request.getTitle())
                .content(request.getContent())
                .isPrivate(request.isPrivate())
                .password(encodedPassword)
                .status(InquiryStatus.PENDING) // 초기 상태는 '답변대기'
                .imageUrls(savedImageUrls)
                .build();

        Inquiry savedInquiry = inquiryRepository.save(inquiry);
        log.info("새로운 1:1 문의가 등록되었습니다. ID: {}", savedInquiry.getId());

        return savedInquiry.getId();
    }

    // 내 문의 내역 조회
    public List<InquiryResponse> getMyInquiries(Member member) {
        // InquiryRepository에 만들어둔 findByMemberIdOrderByIdDesc 사용
        return inquiryRepository.findByMemberIdOrderByIdDesc(member.getId())
                .stream()
                .map(inquiry -> InquiryResponse.builder()
                        .id(inquiry.getId())
                        .title(inquiry.getTitle())
                        .status(inquiry.getStatus().name())
                        .createdAt(inquiry.getCreatedDate())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InquiryDetailResponse getInquiryDetail(Long id, Member member) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));

        // 본인인지 확인
        boolean isOwner = inquiry.getMember().getId().equals(member.getId());
        // 관리자나 매니저인지 확인 (Role enum 확인)
        boolean isAdminOrManager = member.getRole().name().equals("ADMIN") || member.getRole().name().equals("MANAGER");

        // 본인도 아니고, 관리자/매니저도 아니면 403 차단!
        if (!isOwner && !isAdminOrManager) {
            throw new AccessDeniedException("본인의 문의글만 조회할 수 있습니다.");
        }

        return InquiryDetailResponse.builder()
                .id(inquiry.getId())
                .category(inquiry.getCategory().name())
                .title(inquiry.getTitle())
                .content(inquiry.getContent())
                .status(inquiry.getStatus().name())
                .imageUrls(inquiry.getImageUrls())
                .answer(inquiry.getAnswer())
                .createdAt(inquiry.getCreatedDate().toString())
                .build();
    }

    // 관리자용 전체/상태별 문의 조회
    @Transactional(readOnly = true)
    public Page<AdminInquiryResponse> getAllInquiriesForAdmin(String status, Pageable pageable) {
        Page<Inquiry> inquiries;

        // 상태값이 파라미터로 넘어왔다면 필터링, 아니면 전체 조회
        if (status != null && !status.isEmpty()) {
            inquiries = inquiryRepository.findByStatusOrderByIdDesc(InquiryStatus.valueOf(status), pageable);
        } else {
            inquiries = inquiryRepository.findAllByOrderByIdDesc(pageable);
        }

        // 엔티티를 DTO로 변환하여 반환
        return inquiries.map(inq -> AdminInquiryResponse.builder()
                .id(inq.getId())
                .category(inq.getCategory().name())
                .title(inq.getTitle())
                .authorName(inq.getMember().getName())
                .authorEmail(inq.getMember().getEmail())
                .status(inq.getStatus().name())
                .createdAt(inq.getCreatedDate())
                .isPrivate(inq.isPrivate())
                .build());
    }

    // 관리자용 답변 등록
    @Transactional
    public void answerInquiry(Long inquiryId, String answer) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));

        // 엔티티 내부에 만들어둔 비즈니스 메서드 호출 (더티 체킹으로 자동 UPDATE 쿼리 발생)
        inquiry.addAnswer(answer);

        // 답변 완료 시 알림톡 발송
        kakaoAlimtalkService.sendInquiryAnswered(
                inquiry.getMember().getPhoneNumber(),
                inquiry.getMember().getName(),
                inquiry.getTitle()
        );
    }

    // 비밀번호 확인 로직
    @Transactional(readOnly = true)
    public InquiryDetailResponse checkInquiryPassword(Long id, String password) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));

        // 비밀글이 아니면 애초에 검사할 필요 없음
        if (inquiry.isPrivate()) {
            // 비밀번호가 틀리면 예외 발생 (프론트에서 400 에러로 처리됨)
            // (주의: 본인의 암호화 방식에 맞게 passwordEncoder.matches 등을 사용하셨다면 그대로 유지)
            if (!passwordEncoder.matches(password, inquiry.getPassword())) {
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
            }
        }

        // 비밀번호가 맞다면, 두 번 요청할 필요 없이 즉시 상세 데이터를 만들어서 던져줌
        return InquiryDetailResponse.builder()
                .id(inquiry.getId())
                .category(inquiry.getCategory().name())
                .title(inquiry.getTitle())
                .content(inquiry.getContent())
                .status(inquiry.getStatus().name())
                .imageUrls(inquiry.getImageUrls())
                .answer(inquiry.getAnswer())
                .createdAt(inquiry.getCreatedDate().toString()) // 필요시 포맷팅
                .build();
    }

    @Transactional
    public void updateInquiry(Long id, InquiryRequest request, Member member) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));

        // 1. 소유자 확인
        if (!inquiry.getMember().getId().equals(member.getId())) {
            throw new AccessDeniedException("본인의 문의글만 수정할 수 있습니다.");
        }

        // 2. 답변 완료 상태 확인 (핵심)
        if (inquiry.getStatus() == InquiryStatus.ANSWERED) {
            throw new IllegalStateException("이미 답변이 완료된 문의는 수정할 수 없습니다.");
        }

        // 3. 이미지 업데이트 로직 (새로운 이미지가 업로드된 경우 기존 이미지 대체)
        List<String> updatedImageUrls = inquiry.getImageUrls();
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            if (request.getImages().size() > 3) {
                throw new IllegalArgumentException("이미지는 최대 3장까지만 업로드 가능합니다.");
            }
            updatedImageUrls = new ArrayList<>();
            for (MultipartFile file : request.getImages()) {
                if (file.getSize() > MAX_IMAGE_SIZE) {
                    throw new IllegalArgumentException("첨부 이미지는 5MB를 초과할 수 없습니다.");
                }
                updatedImageUrls.add(fileStorageService.uploadFile(file, "inquiries"));
            }
        }

        // 4. 비밀번호 갱신 처리
        String encodedPassword = null;
        if (request.isPrivate() && request.getPassword() != null && !request.getPassword().isEmpty()) {
            encodedPassword = passwordEncoder.encode(request.getPassword());
        }

        // 5. 엔티티 업데이트 (더티 체킹)
        inquiry.update(request.getTitle(), request.getContent(), request.isPrivate(), encodedPassword, updatedImageUrls);
    }

    @Transactional
    public void deleteInquiry(Long id, Member member) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));

        if (!inquiry.getMember().getId().equals(member.getId())) {
            throw new AccessDeniedException("본인의 문의글만 삭제할 수 있습니다.");
        }

        if (inquiry.getStatus() == InquiryStatus.ANSWERED) {
            throw new IllegalStateException("이미 답변이 완료된 문의는 삭제할 수 없습니다.");
        }

        inquiryRepository.delete(inquiry);
    }
}
