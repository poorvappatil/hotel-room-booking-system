
package com.hotel.booking.dto;
import java.time.LocalDate;

public class BookingResponse {

    private Long id;
    private Long roomId;
    private String guestName;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String status;

    //Constructor
    public BookingResponse(Long id, Long roomId, String guestName, LocalDate checkInDate, LocalDate checkOutDate,String status) {
        this.id = id;
        this.roomId = roomId;
        this.guestName = guestName;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.status = status;
    }

    //Getter
    public Long getId() {
        return id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public String getGuestName() {
        return guestName;
    }

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public LocalDate getCheckOutDate() {
        return checkOutDate;
    }

    public String getStatus() {
        return status;
    }
}
