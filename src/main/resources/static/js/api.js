/**
 * LUMIÈRE HOTEL & RESIDENCES - API CLIENT
 * Communicates with existing Spring Boot REST endpoints.
 * Handles mixed JSON & Plain-Text backend error payloads gracefully.
 */

const API = {
  BASE_ROOMS: '/api/rooms',
  BASE_BOOKINGS: '/api/bookings',

  /**
   * Internal request helper
   */
  async request(url, options = {}) {
    const config = {
      headers: {
        'Accept': 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      // Check Content-Type
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!response.ok) {
        // Backend returns JSON for RoomNotFound & IllegalArgumentException,
        // but plain text string for BookingConflictException & BookingNotFoundException.
        let errorMsg;
        if (isJson) {
          const errBody = await response.json();
          errorMsg = errBody.message || errBody.error || `Error ${response.status}`;
        } else {
          errorMsg = await response.text();
        }

        const error = new Error(errorMsg || `Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return isJson ? await response.json() : await response.text();
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err);
      throw err;
    }
  },

  /* ---------------- ROOMS APIS ---------------- */
  async getAllRooms() {
    return this.request(this.BASE_ROOMS);
  },

  async getRoomById(id) {
    return this.request(`${this.BASE_ROOMS}/${id}`);
  },

  async createRoom(roomData) {
    return this.request(this.BASE_ROOMS, {
      method: 'POST',
      body: JSON.stringify(roomData)
    });
  },

  async updateRoom(id, roomData) {
    return this.request(`${this.BASE_ROOMS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData)
    });
  },

  async deleteRoom(id) {
    return this.request(`${this.BASE_ROOMS}/${id}`, {
      method: 'DELETE'
    });
  },

  /* ---------------- BOOKINGS APIS ---------------- */
  async getAllBookings() {
    return this.request(this.BASE_BOOKINGS);
  },

  async getBookingById(id) {
    return this.request(`${this.BASE_BOOKINGS}/${id}`);
  },

  async createBooking(bookingData) {
    return this.request(this.BASE_BOOKINGS, {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  },

  async cancelBooking(id) {
    return this.request(`${this.BASE_BOOKINGS}/${id}/cancel`, {
      method: 'PATCH'
    });
  },

  async deleteBooking(id) {
    return this.request(`${this.BASE_BOOKINGS}/${id}`, {
      method: 'DELETE'
    });
  }
};
