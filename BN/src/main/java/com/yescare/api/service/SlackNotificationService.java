package com.yescare.api.service;

import com.yescare.api.domain.Reservation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class SlackNotificationService {

    @Value("${slack.webhook.reservation-url:}")
    private String webhookUrl;

    @Async
    public void sendNewReservationAlert(Reservation reservation) {
        if (webhookUrl == null || webhookUrl.isEmpty()) {
            log.warn("Slack Webhook URL이 설정되지 않아 알림을 생략합니다.");
            return;
        }

        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH:mm");
            List<Map<String, Object>> blocks = new ArrayList<>();

            // 1. 헤더 블록 (가장 크고 굵은 제목 표출)
            Map<String, Object> headerBlock = new HashMap<>();
            headerBlock.put("type", "header");
            Map<String, Object> headerText = new HashMap<>();
            headerText.put("type", "plain_text");
            headerText.put("text", "🚨 신규 동행 예약이 접수되었습니다!");
            headerText.put("emoji", true);
            headerBlock.put("text", headerText);
            blocks.add(headerBlock);

            // 2. 구분선 (가로줄)
            Map<String, Object> dividerBlock = new HashMap<>();
            dividerBlock.put("type", "divider");
            blocks.add(dividerBlock);

            // 3. 섹션 + 필드 블록 (데이터를 2열 표 형식으로 예쁘게 배치)
            Map<String, Object> sectionBlock = new HashMap<>();
            sectionBlock.put("type", "section");

            List<Map<String, String>> fields = new ArrayList<>();
            fields.add(Map.of("type", "mrkdwn", "text", "*👤 예약자명:* " + reservation.getMember().getName()));
            fields.add(Map.of("type", "mrkdwn", "text", "*🏥 방문 병원:* " + reservation.getHospitalName()));
            fields.add(Map.of("type", "mrkdwn", "text", "*📅 예약 일시:* " + reservation.getReservationTime().format(formatter)));
            fields.add(Map.of("type", "mrkdwn", "text", "*📍 만나는 장소:* " + reservation.getMeetingType()));

            sectionBlock.put("fields", fields);
            blocks.add(sectionBlock);

            // 4. 구분선 (가로줄)
            blocks.add(dividerBlock);

            // 5. 컨텍스트 블록 (하단에 회색의 작은 글씨로 안내 멘트)
            Map<String, Object> contextBlock = new HashMap<>();
            contextBlock.put("type", "context");
            List<Map<String, String>> contextElements = new ArrayList<>();
            contextElements.add(Map.of("type", "mrkdwn", "text", "💡 대시보드에서 예약 내역을 확인하고 신속하게 매니저를 배정해 주세요."));
            contextBlock.put("elements", contextElements);
            blocks.add(contextBlock);

            // 6. 액션 버튼 블록 (초록색 어드민 이동 버튼)
            Map<String, Object> actionBlock = new HashMap<>();
            actionBlock.put("type", "actions");

            Map<String, Object> buttonElement = new HashMap<>();
            buttonElement.put("type", "button");

            Map<String, Object> buttonText = new HashMap<>();
            buttonText.put("type", "plain_text");
            buttonText.put("text", "어드민 대시보드 열기");
            buttonText.put("emoji", true);

            buttonElement.put("text", buttonText);
            buttonElement.put("style", "primary"); // 초록색 강조
            buttonElement.put("url", "https://wellcommunity-yescare.co.kr/admin");

            actionBlock.put("elements", List.of(buttonElement));
            blocks.add(actionBlock);

            // 7. 최종 페이로드 조립 및 전송
            Map<String, Object> payload = new HashMap<>();
            payload.put("blocks", blocks);

            RestTemplate restTemplate = new RestTemplate();
            restTemplate.postForEntity(webhookUrl, payload, String.class);

            log.info("슬랙 신규 예약 알림(디자인 개선) 전송 성공 (예약번호: {})", reservation.getId());

        } catch (Exception e) {
            log.error("슬랙 예약 알림 전송 실패", e);
        }
    }
}