package com.yescare.api.domain; // 본인의 패키지명에 맞게 확인해주세요!

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Inquiry extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Enumerated(EnumType.STRING)
    private InquiryCategory category;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private boolean isPrivate;

    private String password;

    @Enumerated(EnumType.STRING)
    private InquiryStatus status;

    @Builder.Default // Builder 사용 시 리스트 초기화 에러를 막아주는 핵심!
    @ElementCollection
    private List<String> imageUrls = new ArrayList<>();

    private String answer;

    // 관리자 답변 등록 및 상태 변경 메서드
    public void addAnswer(String answer) {
        this.answer = answer;
        this.status = InquiryStatus.ANSWERED;
    }
}