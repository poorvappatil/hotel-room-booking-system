/**
 * LUMIÈRE HOTEL & RESIDENCES - UTILITY HELPERS
 */

const UTILS = {
  /**
   * Currency formatter in Indian Rupees (INR)
   */
  formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return '₹0';
    const num = Number(amount);
    const hasDecimals = num % 1 !== 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2
    }).format(num);
  },

  /**
   * Date formatting for display (e.g. Oct 28, 2026)
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    // dateString is YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return dateString;
  },

  /**
   * Get today's date in YYYY-MM-DD
   */
  getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Get date N days from now in YYYY-MM-DD
   */
  getDateOffsetString(offsetDays = 1, baseDateStr = null) {
    let base = new Date();
    if (baseDateStr) {
      const parts = baseDateStr.split('-');
      if (parts.length === 3) {
        base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    base.setDate(base.getDate() + offsetDays);
    const year = base.getFullYear();
    const month = String(base.getMonth() + 1).padStart(2, '0');
    const day = String(base.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Calculate difference in days between two YYYY-MM-DD dates
   */
  calculateNights(checkInStr, checkOutStr) {
    if (!checkInStr || !checkOutStr) return 0;
    const d1 = new Date(checkInStr);
    const d2 = new Date(checkOutStr);
    const diffTime = d2.getTime() - d1.getTime();
    if (diffTime <= 0) return 0;
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Get URL query parameter
   */
  getQueryParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
  },

  /**
   * Toast notification helper
   */
  showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠';

    toast.innerHTML = `
      <span style="font-weight: 700; font-size: 1.1rem;">${icon}</span>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const removeToast = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', removeToast);

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
  },

  /**
   * Curated photography for room categories
   */
  getRoomImage(type = '') {
    const t = type.toLowerCase();
    if (t.includes('deluxe') || t.includes('ocean')) {
      return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';
    }
    if (t.includes('suite') || t.includes('president') || t.includes('executive')) {
      return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80';
    }
    if (t.includes('double') || t.includes('family')) {
      return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80';
    }
    if (t.includes('single') || t.includes('classic') || t.includes('standard')) {
      return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80';
    }
    return 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80';
  },

  /**
   * Curated amenities list based on room type
   */
  getRoomAmenities(type = '') {
    const t = type.toLowerCase();
    const common = ['High-Speed WiFi', 'Climate Control', 'Smart LED TV', 'Ensuite Rain Shower', 'Organic Toiletries'];
    if (t.includes('suite') || t.includes('deluxe') || t.includes('executive')) {
      return [...common, 'Private Balcony', 'Nespresso Coffee Bar', '24/7 Room Service', 'King Bed'];
    }
    return [...common, 'Work Desk', 'Tea Maker', 'Daily Housekeeping'];
  }
};
