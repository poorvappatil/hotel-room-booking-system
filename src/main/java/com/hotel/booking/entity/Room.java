package com.hotel.booking.entity;
import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

@Entity 
public class Room {

    //Data Members
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    private String roomNumber;
    private String type;
    private BigDecimal pricePerNight;
    private int capacity;
    private boolean active;

    //No-Argument Constructor
    public Room(){}

    //Getter-Setter functions
    //ID
    public Long getId(){
        return id;
    }

    //Room number
    public String getRoomNumber(){
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber){
        this.roomNumber=roomNumber;
    }

    //Type
    public String getType(){
        return type;
    }

    public void setType(String type){
        this.type=type;
    }

    //Price Per Night
    public BigDecimal getPricePerNight(){
        return pricePerNight;
    }

    public void setPricePerNight(BigDecimal pricePerNight){
        this.pricePerNight=pricePerNight;
    }

    //Capacity
    public int getCapacity(){
        return capacity;
    }

    public void setCapacity(int capacity){
        this.capacity=capacity;
    }

    //Active
    public boolean isActive(){
        return active;
    }

    public void setActive(boolean active){
        this.active=active;
    }

}
