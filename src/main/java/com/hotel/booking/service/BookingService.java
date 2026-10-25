
package com.hotel.booking.service;

import org.springframework.stereotype.Service;
import java.util.List;
import com.hotel.booking.entity.Booking;
import com.hotel.booking.entity.Room;
import com.hotel.booking.dto.CreateBookingRequest;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.exception.RoomNotFoundException;
import com.hotel.booking.exception.BookingNotFoundException;
import com.hotel.booking.exception.BookingConflictException;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;

    //Constructor Dependency Injection
    public BookingService(BookingRepository bookingRepository, RoomRepository roomRepository) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional 
    public Booking createBooking(CreateBookingRequest request) {

        //Validate the room ID
        if (request.getRoomId() == null) {
            throw new IllegalArgumentException("Room ID is required.");
        }

        //Retrieve the room
        Room room = roomRepository.findByIdForUpdate(request.getRoomId())
                .orElseThrow(() ->
                        new RoomNotFoundException("Room not found with ID: " + request.getRoomId())
                );

        //Check whether the room is active
        if (!room.isActive()) {
            throw new IllegalArgumentException("This room is not active.");
        }

        //Validate guest name
        String guestName = request.getGuestName();

        if (guestName == null || guestName.isBlank()) {
            throw new IllegalArgumentException("Guest name cannot be empty.");
        }

        //Validate booking dates
        LocalDate checkIn = request.getCheckInDate();
        LocalDate checkOut = request.getCheckOutDate();

        if (checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("Check-in and check-out dates are required.");
        }

        if (checkIn.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Check-in date cannot be in the past.");
        }

        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Check-out must be after check-in.");
        }
        
        //Check for Overlapping bookings
        boolean alreadyBooked = bookingRepository.existsOverlappingBooking(room.getId(),checkIn,checkOut);

        if (alreadyBooked) {
            throw new BookingConflictException("Room is already booked for the selected dates.");
        }


        //Create the Booking object
        Booking booking = new Booking();

        booking.setRoom(room);
        booking.setGuestName(guestName.trim());
        booking.setCheckInDate(checkIn);
        booking.setCheckOutDate(checkOut);
        booking.setStatus("CONFIRMED");

        //Save the bookings
        return bookingRepository.save(booking);
    }

    //Delete booking
    public void deleteBookingById(Long id){
        if(!bookingRepository.existsById(id)){
            throw new BookingNotFoundException("Booking not found with ID: "+id);
        }

        bookingRepository.deleteById(id);
    }

    // Retrieve all bookings
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // Retrieve booking by ID
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() ->
                    new BookingNotFoundException("Booking not found with ID: " + id)
                );
    }

    
    // CANCEL BOOKING
    public Booking cancelBooking(Long id) {

        // Find the booking
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() ->
                    new BookingNotFoundException("Booking not found with ID: " + id)
                );

        // Check whether booking is already cancelled
        if ("CANCELLED".equals(booking.getStatus())) {
            throw new BookingConflictException("Booking is already cancelled.");
        }

        // Change booking status
        booking.setStatus("CANCELLED");

        // Save updated booking
        return bookingRepository.save(booking);
    }


}
