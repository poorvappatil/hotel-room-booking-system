package com.hotel.booking.service;

import org.springframework.stereotype.Service;
import com.hotel.booking.entity.Room;
import com.hotel.booking.exception.RoomNotFoundException;
import com.hotel.booking.repository.RoomRepository;
import java.util.List;

@Service 
public class RoomService {
    private final RoomRepository roomRepository;

    //Constructor Dependency Injection
    public RoomService(RoomRepository roomRepository){
        this.roomRepository=roomRepository;
    }

    //Validate Rooms
    private void validateRoom(Room room){

        //Trim roomNumber if blank spaces are present and Validate Room Number
        String roomNumber =room.getRoomNumber();
        if(roomNumber==null || roomNumber.isBlank()){
            throw new IllegalArgumentException("Room Number cannot be empty.");
        }
        roomNumber= roomNumber.trim();
        room.setRoomNumber(roomNumber);


        //check Price constraints
        if(room.getPricePerNight()==null || room.getPricePerNight().signum()<=0){
            throw new IllegalArgumentException("Invalid Price. Enter a positive value.");
        }

        //check Capacity constraints
        if(room.getCapacity()<=0){
            throw new IllegalArgumentException("Invalid Capacity. Enter value greater than zero.");
        }
    }

    //Function to add Rooms
    public Room addRoom(Room room){

        validateRoom(room);

        //check for duplicate Room Numbers
        if(roomRepository.existsByRoomNumber(room.getRoomNumber())){
            throw new IllegalArgumentException("Room number already exists.");
        }

        return roomRepository.save(room);
    }

    //Retrieve all hotel records
    public List<Room> getAllRooms(){
        return roomRepository.findAll();
    }

    //Retrieve specific ID
    public Room getRoomById(Long id){
        return roomRepository.findById(id)
            .orElseThrow(() ->
                new RoomNotFoundException("Room not found with ID: " +id)
            );
    }

    //Update existing record by Id
    public Room updateRoomById(Long id, Room updatedRoom){
        Room existingRoom= roomRepository.findById(id)
            .orElseThrow(()->
                new RoomNotFoundException("Room not found with ID: "+id)
        );

        validateRoom(updatedRoom);

        //Updation code
        existingRoom.setRoomNumber(updatedRoom.getRoomNumber());
        existingRoom.setType(updatedRoom.getType());
        existingRoom.setPricePerNight(updatedRoom.getPricePerNight());
        existingRoom.setCapacity(updatedRoom.getCapacity());
        existingRoom.setActive(updatedRoom.isActive());

        return roomRepository.save(existingRoom);

    }

    //delete Room 
    public void deleteRoomById(Long id){
        if(!roomRepository.existsById(id)){
            throw new RoomNotFoundException("Room not found with ID: "+id);
        }

        roomRepository.deleteById(id);
    }
}
