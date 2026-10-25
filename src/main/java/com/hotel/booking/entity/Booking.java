package com.hotel.booking.entity;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import java.time.LocalDate;

@Entity
public class Booking {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    private String guestName;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String status;

    public Booking(){}

    //ID
    public Long getId(){
        return id;
    }

    public void setId(Long id){
        this.id=id;
    }

    //Room
    public Room getRoom(){
        return room;
    }

    public void setRoom(Room room){
        this.room=room;
    }

    //GuestName
    public String getGuestName(){
        return guestName;
    }

    public void setGuestName(String guestName){
        this.guestName=guestName;
    }

    //Check in date
    public LocalDate getCheckInDate(){
        return checkInDate;
    }

    public void setCheckInDate(LocalDate checkInDate){
        this.checkInDate=checkInDate;
    }

    //Check Out date
    public LocalDate getCheckOutDate(){
        return checkOutDate;
    }

    public void setCheckOutDate(LocalDate checkOutDate){
        this.checkOutDate=checkOutDate;
    }

    //Status
    public String getStatus(){
        return status;
    }

    public void setStatus(String status){
        this.status=status;
    }
}
