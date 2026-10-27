/**
 * LUMIÈRE HOTEL & RESIDENCES - STAFF ROOM MANAGER CONTROLLER
 * Interacts with /api/rooms CRUD endpoints.
 */

let staffRooms = [];
let pendingDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  initModals();
  loadStaffRooms();
});

async function loadStaffRooms() {
  const tbody = document.getElementById('roomsTableBody');

  try {
    const data = await API.getAllRooms();
    staffRooms = Array.isArray(data) ? data : [];

    if (staffRooms.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="padding: 2.5rem;">
            No rooms found in database. Click <strong>"+ Add New Room"</strong> to create initial rooms.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = staffRooms.map(r => `
      <tr id="table-room-${r.id}">
        <td>#${r.id}</td>
        <td><strong>${r.roomNumber}</strong></td>
        <td>${r.type || 'Standard'}</td>
        <td>${r.capacity} Guests</td>
        <td><strong>${UTILS.formatCurrency(r.pricePerNight)}</strong></td>
        <td>
          <span class="badge ${r.active ? 'badge-active' : 'badge-inactive'}">
            ${r.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-outline btn-sm edit-btn" data-id="${r.id}" style="margin-right: 4px;">
            Edit
          </button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${r.id}">
            Delete
          </button>
        </td>
      </tr>
    `).join('');

    // Attach row button listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openDeleteModal(id);
      });
    });

  } catch (err) {
    console.error('Failed to load room inventory:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="padding: 2.5rem; color: var(--color-danger);">
          Error connecting to Spring Boot backend: ${err.message}
        </td>
      </tr>
    `;
  }
}

function initModals() {
  const roomModal = document.getElementById('roomModal');
  const deleteModal = document.getElementById('deleteModal');
  const openAddBtn = document.getElementById('openAddRoomModalBtn');
  const closeRoomBtn = document.getElementById('closeRoomModalBtn');
  const cancelRoomBtn = document.getElementById('cancelRoomModalBtn');
  const closeDeleteBtn = document.getElementById('closeDeleteModalBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const roomForm = document.getElementById('roomForm');

  const closeRoomModal = () => {
    roomModal.classList.remove('active');
    clearFeedback();
  };

  const closeDeleteModal = () => {
    deleteModal.classList.remove('active');
    pendingDeleteId = null;
  };

  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      document.getElementById('roomModalTitle').textContent = 'Add New Room';
      document.getElementById('editRoomId').value = '';
      document.getElementById('roomNumberInput').value = '';
      document.getElementById('roomTypeInput').value = '';
      document.getElementById('capacityInput').value = '2';
      document.getElementById('priceInput').value = '';
      document.getElementById('activeCheckbox').checked = true;
      clearFeedback();
      roomModal.classList.add('active');
    });
  }

  if (closeRoomBtn) closeRoomBtn.addEventListener('click', closeRoomModal);
  if (cancelRoomBtn) cancelRoomBtn.addEventListener('click', closeRoomModal);
  if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', closeDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  // Room Form Submit (Add or Edit)
  if (roomForm) {
    roomForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFeedback();

      const editId = document.getElementById('editRoomId').value;
      const roomNumber = document.getElementById('roomNumberInput').value.trim();
      const type = document.getElementById('roomTypeInput').value.trim();
      const capacity = parseInt(document.getElementById('capacityInput').value, 10);
      const pricePerNight = parseFloat(document.getElementById('priceInput').value);
      const active = document.getElementById('activeCheckbox').checked;

      let isValid = true;
      if (!roomNumber) {
        document.getElementById('roomNumFeedback').textContent = 'Room Number cannot be empty.';
        isValid = false;
      }
      if (!type) {
        document.getElementById('roomTypeFeedback').textContent = 'Room type is required.';
        isValid = false;
      }
      if (isNaN(capacity) || capacity <= 0) {
        document.getElementById('capacityFeedback').textContent = 'Capacity must be greater than zero.';
        isValid = false;
      }
      if (isNaN(pricePerNight) || pricePerNight <= 0) {
        document.getElementById('priceFeedback').textContent = 'Price must be a positive value.';
        isValid = false;
      }

      if (!isValid) return;

      const payload = {
        roomNumber,
        type,
        capacity,
        pricePerNight,
        active
      };

      const saveBtn = document.getElementById('saveRoomBtn');
      saveBtn.disabled = true;

      try {
        if (editId) {
          // Update
          await API.updateRoom(editId, payload);
          UTILS.showToast(`Room ${roomNumber} updated successfully!`, 'success');
        } else {
          // Create
          await API.createRoom(payload);
          UTILS.showToast(`Room ${roomNumber} created successfully!`, 'success');
        }

        closeRoomModal();
        loadStaffRooms();
      } catch (err) {
        console.error('Room save failed:', err);
        UTILS.showToast(err.message || 'Operation failed.', 'error');
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  // Confirm Delete
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!pendingDeleteId) return;

      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = 'Deleting...';

      try {
        await API.deleteRoom(pendingDeleteId);
        UTILS.showToast('Room record deleted.', 'warning');
        closeDeleteModal();
        loadStaffRooms();
      } catch (err) {
        console.error('Failed to delete room:', err);
        UTILS.showToast(err.message || 'Could not delete room record.', 'error');
      } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Delete Room';
      }
    });
  }
}

function openEditModal(id) {
  const room = staffRooms.find(r => String(r.id) === String(id));
  if (!room) return;

  document.getElementById('roomModalTitle').textContent = `Edit Room ${room.roomNumber}`;
  document.getElementById('editRoomId').value = room.id;
  document.getElementById('roomNumberInput').value = room.roomNumber || '';
  document.getElementById('roomTypeInput').value = room.type || '';
  document.getElementById('capacityInput').value = room.capacity || 2;
  document.getElementById('priceInput').value = room.pricePerNight || '';
  document.getElementById('activeCheckbox').checked = !!room.active;

  clearFeedback();
  document.getElementById('roomModal').classList.add('active');
}

function openDeleteModal(id) {
  const room = staffRooms.find(r => String(r.id) === String(id));
  if (!room) return;

  pendingDeleteId = id;
  document.getElementById('deleteRoomInfo').textContent = `${room.type} (Room ${room.roomNumber})`;
  document.getElementById('deleteModal').classList.add('active');
}

function clearFeedback() {
  document.querySelectorAll('.form-feedback').forEach(el => el.textContent = '');
}
