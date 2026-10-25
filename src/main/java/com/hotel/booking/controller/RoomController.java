package com.hotel.booking.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import com.hotel.booking.service.RoomService;
import com.hotel.booking.entity.Room;
import java.util.List;

@RestController 
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService roomService;

    //Constructor Dependency Injection
    public RoomController(RoomService roomService){
        this.roomService=roomService;
    }

    //Post Mapping to insert a new room
    @PostMapping 
    public Room createRoom(@RequestBody Room room){
        return roomService.addRoom(room);
    }

    //Get Mapping to return all room records
    @GetMapping 
    public List<Room> getAllRooms(){
        return roomService.getAllRooms();
    }

    //GetMapping to return a record of specific ID
    @GetMapping("/{id}")
    public Room getRoomById(@PathVariable Long id){
        return roomService.getRoomById(id);
    }

    //Update existing Record
    @PutMapping("/{id}")
    public Room updateRoom(@PathVariable Long id, @RequestBody Room updatedRoom){
        return roomService.updateRoomById(id, updatedRoom);
    }

    //Delete a record
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoomById(@PathVariable Long id){
        roomService.deleteRoomById(id);
    }
}
