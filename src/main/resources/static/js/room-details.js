/**
 * LUMIÈRE HOTEL & RESIDENCES - ROOM DETAILS CONTROLLER
 */

let currentRoom = null;

document.addEventListener('DOMContentLoaded', () => {
  const roomId = UTILS.getQueryParam('id');
  if (!roomId) {
    showErrorState('No room ID specified. Please select a room from our catalog.');
    return;
  }
  loadRoomDetails(roomId);
});

async function loadRoomDetails(id) {
  const container = document.getElementById('roomDetailContainer');
  const breadcrumb = document.getElementById('breadcrumbRoomTitle');

  try {
    const room = await API.getRoomById(id);
    currentRoom = room;

    if (breadcrumb) {
      breadcrumb.textContent = `${room.type || 'Suite'} - Room ${room.roomNumber}`;
    }

    renderRoomDetail(room);
  } catch (err) {
    console.error('Failed to load room details:', err);
    showErrorState(err.message || 'Room could not be found or loaded.');
  }
}

function renderRoomDetail(room) {
  const container = document.getElementById('roomDetailContainer');
  const imageUrl = UTILS.getRoomImage(room.type);
  const amenities = UTILS.getRoomAmenities(room.type);
  const formattedPrice = UTILS.formatCurrency(room.pricePerNight);
  const today = UTILS.getTodayString();
  const tomorrow = UTILS.getDateOffsetString(1);

  container.innerHTML = `
    <div class="room-detail-layout">
      <!-- Main Content Column -->
      <div>
        <div class="detail-hero-img-wrap">
          <img src="${imageUrl}" alt="${room.type} Suite" class="detail-hero-img">
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-sm);">
          <div>
            <span class="section-subtitle">Suite Accommodation</span>
            <h1 style="font-size: 2.2rem; margin-top: 4px;">${room.type || 'Luxury Suite'}</h1>
          </div>
          <div>
            <span class="badge ${room.active ? 'badge-active' : 'badge-inactive'}" style="font-size: 0.85rem; padding: 0.4rem 0.9rem;">
              ${room.active ? '● Available for Booking' : '● Inactive / Maintenance'}
            </span>
          </div>
        </div>

        <div class="specs-strip">
          <div class="spec-item">
            <span class="spec-icon">🚪</span>
            <span>Room Number: <strong>${room.roomNumber}</strong></span>
          </div>
          <div class="spec-item">
            <span class="spec-icon">👥</span>
            <span>Max Guests: <strong>${room.capacity} ${room.capacity === 1 ? 'Guest' : 'Guests'}</strong></span>
          </div>
          <div class="spec-item">
            <span class="spec-icon">🏷️</span>
            <span>Base Rate: <strong>${formattedPrice} / night</strong></span>
          </div>
        </div>

        <div style="margin: var(--space-xl) 0;">
          <h3 style="margin-bottom: var(--space-sm);">About This Accommodation</h3>
          <p style="margin-bottom: var(--space-md); font-size: 1.05rem; line-height: 1.8;">
            Step into an elevated experience where every detail has been thoughtfully considered. Featuring premium custom millwork, Italian marble bathroom accents, acoustic isolation, and sweeping views of the surrounding grounds, this space is tailored for rest, productivity, and indulgence.
          </p>
        </div>

        <div style="margin: var(--space-xl) 0;">
          <h3 style="margin-bottom: var(--space-sm);">Included Suite Amenities</h3>
          <div class="amenities-list-grid">
            ${amenities.map(a => `
              <div class="amenity-bullet">
                <span>✦</span> ${a}
              </div>
            `).join('')}
          </div>
        </div>

        <div style="margin: var(--space-xl) 0; background-color: var(--color-bg-alt); padding: 1.5rem; border-radius: var(--radius-md);">
          <h4 style="margin-bottom: var(--space-xs);">Hotel Policies & Notes</h4>
          <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">• Check-in begins at 3:00 PM. Early check-in subject to availability.</p>
          <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">• Check-out is 11:00 AM.</p>
          <p style="font-size: 0.9rem;">• Reservations can be cancelled up to 24 hours prior to scheduled check-in without penalty.</p>
        </div>
      </div>

      <!-- Booking Sidebar Column -->
      <aside>
        <div class="booking-sidebar-card">
          <div class="price-callout">
            <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted);">
              Nightly Rate
            </div>
            <div class="amount">${formattedPrice} <span style="font-size: 1rem; font-weight: normal; color: var(--color-text-muted);">/ night</span></div>
          </div>

          <div style="margin-bottom: var(--space-lg);">
            <div class="form-group" style="margin-bottom: var(--space-md);">
              <label for="detailCheckIn" class="form-label">Estimated Check-In</label>
              <input type="date" id="detailCheckIn" class="form-control" min="${today}" value="${today}">
            </div>

            <div class="form-group" style="margin-bottom: var(--space-md);">
              <label for="detailCheckOut" class="form-label">Estimated Check-Out</label>
              <input type="date" id="detailCheckOut" class="form-control" min="${tomorrow}" value="${tomorrow}">
            </div>

            <!-- Stay Summary -->
            <div style="background-color: var(--color-bg-alt); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: var(--space-md);">
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
                <span id="detailNightsLabel">1 Night Stay</span>
                <span id="detailSubtotalLabel">${formattedPrice}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; color: var(--color-primary); border-top: 1px solid var(--color-border); padding-top: 0.5rem; margin-top: 0.5rem;">
                <span>Total Estimate</span>
                <span id="detailTotalLabel" class="text-gold">${formattedPrice}</span>
              </div>
            </div>
          </div>

          ${room.active ? `
            <button id="proceedToBookBtn" class="btn btn-primary btn-block btn-lg">
              Proceed to Reservation ➔
            </button>
          ` : `
            <button class="btn btn-outline btn-block btn-lg" disabled>
              Currently Unavailable
            </button>
            <p style="font-size: 0.8rem; text-align: center; color: var(--color-danger); margin-top: 0.5rem;">
              This room is not currently active for booking.
            </p>
          `}
        </div>
      </aside>
    </div>
  `;

  // Attach interactive recalculation
  setupStayCalculator(room);
}

function setupStayCalculator(room) {
  const checkInInput = document.getElementById('detailCheckIn');
  const checkOutInput = document.getElementById('detailCheckOut');
  const proceedBtn = document.getElementById('proceedToBookBtn');

  if (!checkInInput || !checkOutInput) return;

  const updateCalculation = () => {
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;

    // Adjust checkout min if needed
    if (checkIn) {
      checkOutInput.min = UTILS.getDateOffsetString(1, checkIn);
      if (checkOut <= checkIn) {
        checkOutInput.value = UTILS.getDateOffsetString(1, checkIn);
      }
    }

    const nights = UTILS.calculateNights(checkInInput.value, checkOutInput.value);
    const nightsLabel = document.getElementById('detailNightsLabel');
    const subtotalLabel = document.getElementById('detailSubtotalLabel');
    const totalLabel = document.getElementById('detailTotalLabel');

    if (nights > 0) {
      const total = Number(room.pricePerNight) * nights;
      if (nightsLabel) nightsLabel.textContent = `${nights} ${nights === 1 ? 'Night' : 'Nights'} Stay`;
      if (subtotalLabel) subtotalLabel.textContent = UTILS.formatCurrency(total);
      if (totalLabel) totalLabel.textContent = UTILS.formatCurrency(total);
      if (proceedBtn) proceedBtn.disabled = false;
    } else {
      if (nightsLabel) nightsLabel.textContent = 'Invalid dates selected';
      if (subtotalLabel) subtotalLabel.textContent = '₹0';
      if (totalLabel) totalLabel.textContent = '₹0';
      if (proceedBtn) proceedBtn.disabled = true;
    }
  };

  checkInInput.addEventListener('change', updateCalculation);
  checkOutInput.addEventListener('change', updateCalculation);

  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      const checkIn = checkInInput.value;
      const checkOut = checkOutInput.value;
      window.location.href = `booking.html?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`;
    });
  }
}

function showErrorState(message) {
  const container = document.getElementById('roomDetailContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <h3 class="empty-state-title">Room Not Found</h3>
      <p class="empty-state-desc">${message}</p>
      <a href="rooms.html" class="btn btn-primary">Browse All Accommodations</a>
    </div>
  `;
}
