/**
 * LUMIÈRE HOTEL & RESIDENCES - CONFIRMATION & LOOKUP CONTROLLER
 */

let activeBooking = null;

document.addEventListener('DOMContentLoaded', () => {
  initLookupForm();
  initCancelModal();

  const bookingId = UTILS.getQueryParam('bookingId');
  if (bookingId) {
    document.getElementById('lookupIdInput').value = bookingId;
    loadBooking(bookingId);
  } else {
    showSearchPrompt();
  }
});

function initLookupForm() {
  const form = document.getElementById('lookupForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('lookupIdInput').value.trim();
    if (id) {
      // Update browser URL query param without full reload
      const newUrl = `${window.location.pathname}?bookingId=${id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      loadBooking(id);
    }
  });
}

async function loadBooking(id) {
  const container = document.getElementById('receiptContainer');
  container.innerHTML = `<div class="skeleton" style="height: 400px; border-radius: var(--radius-lg);"></div>`;

  try {
    const booking = await API.getBookingById(id);
    activeBooking = booking;

    // Fetch room details to display room info alongside booking
    let room = null;
    try {
      if (booking.roomId) {
        room = await API.getRoomById(booking.roomId);
      }
    } catch (e) {
      console.warn('Room details could not be loaded for booking:', e);
    }

    renderReceipt(booking, room);

  } catch (err) {
    console.error('Failed to load booking:', err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔎</div>
        <h3 class="empty-state-title">Reservation Not Found</h3>
        <p class="empty-state-desc">No reservation could be located for Booking ID #${id}. Please verify your reference number.</p>
        <a href="rooms.html" class="btn btn-primary">Book a New Stay</a>
      </div>
    `;
  }
}

function renderReceipt(booking, room) {
  const container = document.getElementById('receiptContainer');
  const isCancelled = booking.status === 'CANCELLED';
  const nights = UTILS.calculateNights(booking.checkInDate, booking.checkOutDate);
  const totalCost = room ? (Number(room.pricePerNight) * nights) : 0;

  container.innerHTML = `
    <article class="receipt-card">
      <div class="receipt-header">
        <div class="receipt-badge-wrap">
          <span class="badge ${isCancelled ? 'badge-cancelled' : 'badge-confirmed'}" style="font-size: 0.95rem; padding: 0.5rem 1.25rem;">
            ${isCancelled ? '✕ Reservation Cancelled' : '✓ Reservation Confirmed'}
          </span>
        </div>
        <span class="section-subtitle">Official Guest Folio</span>
        <h2 style="font-size: 2rem; margin-top: 4px;">Booking #${booking.id}</h2>
        <p style="font-size: 0.95rem;">Lumière Hotel & Residences • 742 Evergreen Promenade</p>
      </div>

      <div class="receipt-grid">
        <div class="receipt-field">
          <span class="receipt-label">Guest Full Name</span>
          <span class="receipt-value">${booking.guestName || 'Valued Guest'}</span>
        </div>

        <div class="receipt-field">
          <span class="receipt-label">Current Status</span>
          <span class="receipt-value" style="color: ${isCancelled ? 'var(--color-danger)' : 'var(--color-success)'};">
            ${booking.status}
          </span>
        </div>

        <div class="receipt-field">
          <span class="receipt-label">Accommodation Suite</span>
          <span class="receipt-value">
            ${room ? `${room.type} (Room ${room.roomNumber})` : `Room ID #${booking.roomId}`}
          </span>
        </div>

        <div class="receipt-field">
          <span class="receipt-label">Stay Duration</span>
          <span class="receipt-value">${nights} ${nights === 1 ? 'Night' : 'Nights'}</span>
        </div>

        <div class="receipt-field">
          <span class="receipt-label">Check-In Date</span>
          <span class="receipt-value">${UTILS.formatDate(booking.checkInDate)}</span>
        </div>

        <div class="receipt-field">
          <span class="receipt-label">Check-Out Date</span>
          <span class="receipt-value">${UTILS.formatDate(booking.checkOutDate)}</span>
        </div>

        ${room ? `
          <div class="receipt-field">
            <span class="receipt-label">Nightly Rate</span>
            <span class="receipt-value">${UTILS.formatCurrency(room.pricePerNight)}</span>
          </div>

          <div class="receipt-field">
            <span class="receipt-label">Total Folio Estimate</span>
            <span class="receipt-value text-gold" style="font-size: 1.35rem;">
              ${UTILS.formatCurrency(totalCost)}
            </span>
          </div>
        ` : ''}
      </div>

      <!-- Informative Notes -->
      <div style="background-color: var(--color-bg-alt); padding: 1.25rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--color-text-muted);">
        <p>• <strong>Check-in Notice:</strong> Present this booking confirmation along with a matching government photo ID at the front desk.</p>
        <p style="margin-top: 0.25rem;">• <strong>Front Desk Contact:</strong> +1 (800) 555-0199 (Available 24 hours daily).</p>
      </div>

      <!-- Action Buttons -->
      <div class="receipt-actions no-print">
        <button onclick="window.print()" class="btn btn-outline">
          🖨️ Print / Save Folio
        </button>

        ${!isCancelled ? `
          <button id="openCancelModalBtn" class="btn btn-danger">
            Cancel Reservation
          </button>
        ` : ''}

        <a href="rooms.html" class="btn btn-primary">
          Explore Other Suites
        </a>
      </div>
    </article>
  `;

  // Attach cancel modal trigger
  const cancelBtn = document.getElementById('openCancelModalBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', openCancelModal);
  }
}

function showSearchPrompt() {
  const container = document.getElementById('receiptContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📋</div>
      <h3 class="empty-state-title">Manage Your Reservation</h3>
      <p class="empty-state-desc">Enter your numerical Booking Reference ID in the box above to look up your reservation folio, print your receipt, or request cancellation.</p>
      <a href="rooms.html" class="btn btn-primary">Browse Suites</a>
    </div>
  `;
}

function initCancelModal() {
  const modal = document.getElementById('cancelModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const dismissBtn = document.getElementById('modalDismissBtn');
  const confirmBtn = document.getElementById('modalConfirmCancelBtn');

  const closeModal = () => {
    modal.classList.remove('active');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeModal);

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!activeBooking) return;
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Cancelling...';

      try {
        await API.cancelBooking(activeBooking.id);
        UTILS.showToast('Reservation has been successfully cancelled.', 'warning');
        closeModal();
        loadBooking(activeBooking.id);
      } catch (err) {
        console.error('Cancellation failed:', err);
        UTILS.showToast(err.message || 'Unable to cancel reservation.', 'error');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Yes, Cancel Booking';
      }
    });
  }
}

function openCancelModal() {
  const modal = document.getElementById('cancelModal');
  if (modal) modal.classList.add('active');
}
