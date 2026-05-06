package com.yescare.api.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class ManagerApplyRequest {
    private String licenseName;
    private String experience;
    private String motivation;
    private List<String> availableDays;
    private String availableTime;
}