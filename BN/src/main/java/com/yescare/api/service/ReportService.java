package com.yescare.api.service;

import com.yescare.api.domain.Report;
import com.yescare.api.domain.Reservation;
import com.yescare.api.domain.ReservationStatus;
import com.yescare.api.dto.ReportRequest;
import com.yescare.api.dto.ReportResponse;
import com.yescare.api.repository.ReportRepository;
import com.yescare.api.repository.ReservationRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final ReservationRepository reservationRepository;
    private final EmailService emailService;

    @Transactional
    public Long createReport(ReportRequest request, MultipartFile pdfFile) {
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new IllegalArgumentException("예약 정보를 찾을 수 없습니다."));

        // 체크박스(일정 없음) 처리
        if (request.getNoNextSchedule() != null && request.getNoNextSchedule()) {
            reservation.setNoRevisit(true);
        } else {
            reservation.setNoRevisit(false); // 매니저가 실수로 체크했다가 풀었을 때를 대비해 false 처리
        }

        // 기존에 리포트가 있는지 확인
        Report report = reportRepository.findByReservationId(reservation.getId()).orElse(null);

        if (report != null) {
            // 이미 리포트가 있다면 내용만 덮어쓰기 (Update)
            report.updateReport(
                    request.getDepartment(),
                    request.getDoctorOpinion(),
                    request.getPrescription(),
                    request.getManagerComment(),
                    request.getNextSchedule(),
                    request.getPatientCondition()
            );
        } else {
            // 리포트가 없다면 새로 생성 (Insert)
            report = Report.builder()
                    .reservation(reservation)
                    .department(request.getDepartment())
                    .doctorOpinion(request.getDoctorOpinion())
                    .prescription(request.getPrescription())
                    .managerComment(request.getManagerComment())
                    .nextSchedule(request.getNextSchedule())
                    .patientCondition(request.getPatientCondition())
                    .build();
        }

        // 예약 상태를 완료로 변경하고 리포트 저장
        reservation.updateStatus(ReservationStatus.COMPLETED);
        reportRepository.save(report);

        // 저장 직후, 보호자 이메일로 메일 발송
        emailService.sendCareReport(
                reservation.getMember().getEmail(),
                reservation.getMember().getName(),
                reservation.getHospitalName(),
                request.getDoctorOpinion(),
                pdfFile
        );

        return report.getId();
    }

    @Transactional(readOnly = true)
    public ReportResponse getReportByReservation(Long reservationId) {
        Report report = reportRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("해당 예약에 대한 리포트가 없습니다."));
        return new ReportResponse(report);
    }

    @Transactional(readOnly = true)
    public ReportResponse getReportByReservationId(Long reservationId) {
        Report report = reportRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("해당 예약의 케어 리포트가 아직 작성되지 않았습니다."));

        return new ReportResponse(report);
    }
}