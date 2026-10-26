/**
 * LUMIÈRE HOTEL & RESIDENCES - BOOKING FORM CONTROLLER
 */

let activeRooms = [];
let selectedRoom = null;

document.addEventListener('DOMContentLoaded', () => {
  initDateConstraints();
  loadRoomsAndInitForm();
});

function initDateConstraints() {
  const checkInInput = document.getElementById('checkInDate');
  const checkOutInput = document.getElementById('checkOutDate');

  const today = UTILS.getTodayString();
  const tomorrow = UTILS.getDateOffsetString(1);

  checkInInput.min = today;
  checkInInput.value = UTILS.getQueryParam('checkIn') || today;

  checkOutInput.min = tomorrow;
  checkOutInput.value = UTILS.getQueryParam('checkOut') || tomorrow;

  checkInInput.addEventListener('change', () => {
    const checkInVal = checkInInput.value;
    if (checkInVal) {
      const nextDay = UTILS.getDateOffsetString(1, checkInVal);
      checkOutInput.min = nextDay;
      if (checkOutInput.value <= checkInVal) {
        checkOutInput.value = nextDay;
      }
    }
    updateCostPreview();
  });

  checkOutInput.addEventListener('change', updateCostPreview);
}

async function loadRoomsAndInitForm() {
  const roomSelect = document.getElementById('roomSelect');
  const preselectedRoomId = UTILS.getQueryParam('roomId');

  try {
    const rooms = await API.getAllRooms();
    activeRooms = Array.isArray(rooms) ? rooms.filter(r => r.active) : [];

    if (activeRooms.length === 0) {
      showAlert('No active rooms are currently available for booking. Please contact front desk.', 'warning');
      document.getElementById('submitBookingBtn').disabled = true;
      return;
    }

    // Populate dropdown
    roomSelect.innerHTML = '<option value="">-- Choose an Available Suite --</option>';
    activeRooms.forEach(room => {
      const opt = document.createElement('option');
      opt.value = room.id;
      opt.textContent = `${room.type || 'Suite'} (Room ${room.roomNumber}) - ${UTILS.formatCurrency(room.pricePerNight)}/night`;
      roomSelect.appendChild(opt);
    });

    // Select preselected room if specified
    if (preselectedRoomId) {
      roomSelect.value = preselectedRoomId;
      selectedRoom = activeRooms.find(r => String(r.id) === String(preselectedRoomId)) || null;
      if (!selectedRoom) {
        // Maybe it's a specific room that was requested
        try {
          const single = await API.getRoomById(preselectedRoomId);
          if (single) {
            selectedRoom = single;
            const opt = document.createElement('option');
            opt.value = single.id;
            opt.textContent = `${single.type} (Room ${single.roomNumber}) - ${UTILS.formatCurrency(single.pricePerNight)}/night`;
            roomSelect.appendChild(opt);
            roomSelect.value = single.id;
          }
        } catch (_) {}
      }
    } else if (activeRooms.length > 0) {
      roomSelect.value = activeRooms[0].id;
      selectedRoom = activeRooms[0];
    }

    roomSelect.addEventListener('change', (e) => {
      const rId = e.target.value;
      selectedRoom = activeRooms.find(r => String(r.id) === String(rId)) || null;
      updateCostPreview();
    });

    updateCostPreview();
    initFormSubmit();

  } catch (err) {
    console.error('Failed to load rooms for booking:', err);
    showAlert('Failed to connect to the hotel booking backend service.', 'error');
  }
}

function updateCostPreview() {
  const previewImg = document.getElementById('previewImg');
  const previewTitle = document.getElementById('previewTitle');
  const previewRoomNumber = document.getElementById('previewRoomNumber');
  const previewRoomBadge = document.getElementById('previewRoomBadge');
  const previewCapacity = document.getElementById('previewCapacity');
  const previewRate = document.getElementById('previewRate');
  const previewDuration = document.getElementById('previewDuration');
  const previewTotal = document.getElementById('previewTotal');

  if (!selectedRoom) {
    previewTitle.textContent = 'Select an Accommodation';
    previewRoomNumber.textContent = 'Room: --';
    previewRate.textContent = '₹0';
    previewDuration.textContent = '0 Nights';
    previewTotal.textContent = '₹0';
    return;
  }

  const checkIn = document.getElementById('checkInDate').value;
  const checkOut = document.getElementById('checkOutDate').value;
  const nights = UTILS.calculateNights(checkIn, checkOut);

  previewImg.src = UTILS.getRoomImage(selectedRoom.type);
  previewTitle.textContent = selectedRoom.type || 'Luxury Suite';
  previewRoomNumber.textContent = `Room ${selectedRoom.roomNumber}`;
  previewRoomBadge.textContent = selectedRoom.active ? 'Available' : 'Unavailable';
  previewCapacity.textContent = `👥 Up to ${selectedRoom.capacity} ${selectedRoom.capacity === 1 ? 'Guest' : 'Guests'}`;
  previewRate.textContent = `${UTILS.formatCurrency(selectedRoom.pricePerNight)} / night`;

  if (nights > 0) {
    previewDuration.textContent = `${nights} ${nights === 1 ? 'Night' : 'Nights'}`;
    const total = Number(selectedRoom.pricePerNight) * nights;
    previewTotal.textContent = UTILS.formatCurrency(total);
  } else {
    previewDuration.textContent = 'Invalid Dates';
    previewTotal.textContent = '₹0';
  }
}

function initFormSubmit() {
  const form = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('submitBookingBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const roomId = document.getElementById('roomSelect').value;
    const guestName = document.getElementById('guestName').value.trim();
    const checkInDate = document.getElementById('checkInDate').value;
    const checkOutDate = document.getElementById('checkOutDate').value;

    let isValid = true;

    // Validation
    if (!roomId) {
      showFieldError('roomFeedback', 'Please select an accommodation suite.');
      isValid = false;
    }

    if (!guestName) {
      showFieldError('nameFeedback', 'Primary guest full name is required.');
      isValid = false;
    } else if (guestName.length < 2) {
      showFieldError('nameFeedback', 'Guest name must be at least 2 characters.');
      isValid = false;
    }

    const todayStr = UTILS.getTodayString();
    if (!checkInDate) {
      showFieldError('checkInFeedback', 'Check-in date is required.');
      isValid = false;
    } else if (checkInDate < todayStr) {
      showFieldError('checkInFeedback', 'Check-in date cannot be in the past.');
      isValid = false;
    }

    if (!checkOutDate) {
      showFieldError('checkOutFeedback', 'Check-out date is required.');
      isValid = false;
    } else if (checkOutDate <= checkInDate) {
      showFieldError('checkOutFeedback', 'Check-out date must be strictly after check-in date.');
      isValid = false;
    }

    if (!isValid) return;

    // Submit payload matching backend CreateBookingRequest DTO
    const payload = {
      roomId: parseInt(roomId, 10),
      guestName: guestName,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate
    };

    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline';

    try {
      const response = await API.createBooking(payload);
      UTILS.showToast('Reservation confirmed successfully!', 'success');
      
      // Redirect to confirmation page with booking ID
      setTimeout(() => {
        window.location.href = `confirmation.html?bookingId=${response.id}`;
      }, 700);

    } catch (err) {
      console.error('Booking submission error:', err);
      let errorMsg = err.message || 'An error occurred while creating your reservation.';
      
      if (err.status === 409) {
        // Backend returns "Room is already booked for the selected dates."
        showAlert(`Conflict: ${errorMsg}. Please select alternate stay dates or choose another room.`, 'error');
      } else if (err.status === 400) {
        showAlert(`Validation Error: ${errorMsg}`, 'error');
      } else {
        showAlert(errorMsg, 'error');
      }

      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
    }
  });
}

function showFieldError(elementId, msg) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = msg;
}

function clearErrors() {
  document.getElementById('bookingAlert').style.display = 'none';
  document.querySelectorAll('.form-feedback').forEach(el => el.textContent = '');
}

function showAlert(message, type = 'error') {
  const alertEl = document.getElementById('bookingAlert');
  if (!alertEl) return;
  alertEl.className = `alert-banner alert-${type}`;
  alertEl.textContent = message;
  alertEl.style.display = 'block';
  alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
