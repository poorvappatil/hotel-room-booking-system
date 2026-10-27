/**
 * LUMIÈRE HOTEL & RESIDENCES - ROOMS LISTING CONTROLLER
 */

let allRooms = [];

document.addEventListener('DOMContentLoaded', () => {
  initFilterEvents();
  loadRooms();
});

function initFilterEvents() {
  const searchInput = document.getElementById('searchInput');
  const typeSelect = document.getElementById('typeSelect');
  const capacitySelect = document.getElementById('capacitySelect');
  const maxPriceSelect = document.getElementById('maxPriceSelect');
  const activeFilter = document.getElementById('activeFilter');
  const resetBtn = document.getElementById('resetFiltersBtn');

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (typeSelect) typeSelect.addEventListener('change', applyFilters);
  if (capacitySelect) capacitySelect.addEventListener('change', applyFilters);
  if (maxPriceSelect) maxPriceSelect.addEventListener('change', applyFilters);
  if (activeFilter) activeFilter.addEventListener('change', applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (typeSelect) typeSelect.value = '';
      if (capacitySelect) capacitySelect.value = '';
      if (maxPriceSelect) maxPriceSelect.value = '';
      if (activeFilter) activeFilter.value = 'activeOnly';
      applyFilters();
    });
  }
}

async function loadRooms() {
  const grid = document.getElementById('roomsGrid');
  const countEl = document.getElementById('resultsCount');

  try {
    const data = await API.getAllRooms();
    allRooms = Array.isArray(data) ? data : [];

    // Populate type filter dropdown dynamically
    populateTypeDropdown();

    // Check query params from homepage quick search
    const urlType = UTILS.getQueryParam('type');
    const urlCapacity = UTILS.getQueryParam('capacity');
    const urlMaxPrice = UTILS.getQueryParam('maxPrice');

    if (urlType) {
      const typeSelect = document.getElementById('typeSelect');
      if (typeSelect) typeSelect.value = urlType;
    }
    if (urlCapacity) {
      const capSelect = document.getElementById('capacitySelect');
      if (capSelect) capSelect.value = urlCapacity;
    }
    if (urlMaxPrice) {
      const maxPriceSelect = document.getElementById('maxPriceSelect');
      if (maxPriceSelect) maxPriceSelect.value = urlMaxPrice;
    }

    applyFilters();

  } catch (err) {
    console.error('Failed to load rooms:', err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Unable to Retrieve Rooms</h3>
        <p class="empty-state-desc">${err.message || 'Error communicating with backend service.'}</p>
        <button onclick="loadRooms()" class="btn btn-primary">Retry</button>
      </div>
    `;
    if (countEl) countEl.textContent = '0 accommodations available';
  }
}

function populateTypeDropdown() {
  const typeSelect = document.getElementById('typeSelect');
  if (!typeSelect) return;

  const currentVal = typeSelect.value;
  const types = new Set();
  allRooms.forEach(r => {
    if (r.type && r.type.trim()) {
      types.add(r.type.trim());
    }
  });

  typeSelect.innerHTML = '<option value="">All Types</option>';
  Array.from(types).sort().forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });

  if (currentVal) {
    typeSelect.value = currentVal;
  }
}

function applyFilters() {
  const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const typeVal = document.getElementById('typeSelect')?.value || '';
  const capacityVal = document.getElementById('capacitySelect')?.value || '';
  const maxPriceVal = document.getElementById('maxPriceSelect')?.value || '';
  const activeVal = document.getElementById('activeFilter')?.value || 'activeOnly';

  const filtered = allRooms.filter(room => {
    // Active filter
    if (activeVal === 'activeOnly' && !room.active) {
      return false;
    }

    // Type filter
    if (typeVal && room.type.toLowerCase() !== typeVal.toLowerCase()) {
      return false;
    }

    // Capacity filter
    if (capacityVal && room.capacity < parseInt(capacityVal, 10)) {
      return false;
    }

    // Max Price filter (INR)
    if (maxPriceVal && Number(room.pricePerNight) > parseFloat(maxPriceVal)) {
      return false;
    }

    // Search query
    if (searchVal) {
      const roomNumMatch = String(room.roomNumber || '').toLowerCase().includes(searchVal);
      const typeMatch = String(room.type || '').toLowerCase().includes(searchVal);
      if (!roomNumMatch && !typeMatch) {
        return false;
      }
    }

    return true;
  });

  renderRooms(filtered);
}

function renderRooms(rooms) {
  const grid = document.getElementById('roomsGrid');
  const countEl = document.getElementById('resultsCount');

  if (countEl) {
    countEl.textContent = `Showing ${rooms.length} of ${allRooms.length} accommodations`;
  }

  if (rooms.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">No Accommodations Found</h3>
        <p class="empty-state-desc">No rooms match your chosen filter criteria. Try resetting or adjusting your search parameters.</p>
        <button id="clearFiltersBtn" class="btn btn-outline">Clear All Filters</button>
      </div>
    `;
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
      document.getElementById('resetFiltersBtn')?.click();
    });
    return;
  }

  grid.innerHTML = rooms.map(room => {
    const imageUrl = UTILS.getRoomImage(room.type);
    const amenities = UTILS.getRoomAmenities(room.type).slice(0, 3);
    const formattedPrice = UTILS.formatCurrency(room.pricePerNight);

    return `
      <article class="room-card" id="room-${room.id}">
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
            <span>👥 Up to ${room.capacity} ${room.capacity === 1 ? 'Guest' : 'Guests'}</span>
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
                Book Suite
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
}
