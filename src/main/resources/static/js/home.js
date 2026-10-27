/**
 * LUMIÈRE HOTEL & RESIDENCES - HOMEPAGE LOGIC
 */

document.addEventListener('DOMContentLoaded', () => {
  initQuickSearchForm();
  loadFeaturedRooms();
});

function initQuickSearchForm() {
  const form = document.getElementById('quickSearchForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('filterType').value;
    const capacity = document.getElementById('filterGuests').value;
    const maxPrice = document.getElementById('filterMaxPrice').value;

    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (capacity) params.set('capacity', capacity);
    if (maxPrice) params.set('maxPrice', maxPrice);

    window.location.href = `rooms.html?${params.toString()}`;
  });
}

async function loadFeaturedRooms() {
  const grid = document.getElementById('featuredRoomsGrid');
  if (!grid) return;

  try {
    const rooms = await API.getAllRooms();

    // Prioritize active rooms
    const activeRooms = Array.isArray(rooms) ? rooms.filter(r => r.active) : [];
    const displayRooms = activeRooms.length > 0 ? activeRooms.slice(0, 3) : (rooms || []).slice(0, 3);

    if (displayRooms.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🏨</div>
          <h3 class="empty-state-title">No Rooms Currently Listed</h3>
          <p class="empty-state-desc">The hotel database currently has no room records configured.</p>
          <a href="manage-rooms.html" class="btn btn-primary">Add Rooms in Staff Portal</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = displayRooms.map(room => {
      const imageUrl = UTILS.getRoomImage(room.type);
      const amenities = UTILS.getRoomAmenities(room.type).slice(0, 3);
      const formattedPrice = UTILS.formatCurrency(room.pricePerNight);

      return `
        <article class="room-card" id="room-card-${room.id}">
          <div class="room-card-img-wrap">
            <img src="${imageUrl}" alt="${room.type} Room ${room.roomNumber}" class="room-card-img" loading="lazy">
            <span class="room-card-badge">
              <span class="badge ${room.active ? 'badge-active' : 'badge-inactive'}">
                ${room.active ? '● Available' : '● Maintenance'}
              </span>
            </span>
            <div class="room-card-price-tag">
              <strong>${formattedPrice}</strong> / night
            </div>
          </div>

          <div class="room-card-body">
            <div class="room-card-meta">
              <span>Room ${room.roomNumber}</span>
              <span>👥 Up to ${room.capacity} Guests</span>
            </div>

            <h3 class="room-card-title">${room.type || 'Luxury Suite'}</h3>

            <div class="room-card-features">
              ${amenities.map(a => `<span class="feature-pill">✦ ${a}</span>`).join('')}
            </div>

            <div class="room-card-actions">
              <a href="room-details.html?id=${room.id}" class="btn btn-outline btn-block btn-sm">
                View Details
              </a>
              ${room.active ? `
                <a href="booking.html?roomId=${room.id}" class="btn btn-primary btn-block btn-sm">
                  Book Now
                </a>
              ` : `
                <button class="btn btn-outline btn-block btn-sm" disabled>
                  Unavailable
                </button>
              `}
            </div>
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load featured rooms:', err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Unable to Load Accommodations</h3>
        <p class="empty-state-desc">Could not connect to the backend server. Please verify the Spring Boot service is running.</p>
        <button onclick="loadFeaturedRooms()" class="btn btn-outline">Try Again</button>
      </div>
    `;
  }
}
