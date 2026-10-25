
package com.hotel.booking.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;
import com.hotel.booking.dto.CreateBookingRequest;
import com.hotel.booking.dto.BookingResponse;
import com.hotel.booking.entity.Booking;
import com.hotel.booking.service.BookingService;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    //Constructor Dependency Injection  
    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createBooking(@RequestBody CreateBookingRequest request) {

        Booking booking = bookingService.createBooking(request);

        return new BookingResponse(
                booking.getId(),
                booking.getRoom().getId(),
                booking.getGuestName(),
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                booking.getStatus()
        );
    }

     // GET ALL BOOKINGS
    @GetMapping
    public List<BookingResponse> getAllBookings() {

        return bookingService.getAllBookings()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // GET BOOKING BY ID
    @GetMapping("/{id}")
    public BookingResponse getBookingById(@PathVariable Long id) {

        Booking booking = bookingService.getBookingById(id);

        return toResponse(booking);
    }

    
    // CANCEL BOOKING
    @PatchMapping("/{id}/cancel")
    public BookingResponse cancelBooking(@PathVariable Long id){
        Booking booking = bookingService.cancelBooking(id);

        return toResponse(booking);
    }


    private BookingResponse toResponse(Booking booking) {
    return new BookingResponse(
            booking.getId(),
            booking.getRoom().getId(),
            booking.getGuestName(),
            booking.getCheckInDate(),
            booking.getCheckOutDate(),
            booking.getStatus()
    );
}
}
