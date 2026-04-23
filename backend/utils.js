function norm(v = '') {
  return v.trim().toUpperCase();
}

// Parse NRB date format "dd/Month/yyyy" (e.g. "01/January/1990") to a Date
function parseNrbDate(d) {
  if (!d) return new Date(NaN);
  const parts = d.split('/');
  if (parts.length === 3) {
    // dd/Month/yyyy
    return new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`);
  }
  // fallback: try ISO or other formats
  return new Date(d);
}

function ageFrom(d) {
  const dob = parseNrbDate(d);
  const t = new Date();
  let a = t.getFullYear() - dob.getFullYear();
  const m = t.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < dob.getDate())) a--;
  return a;
}

function expired(d) {
  return parseNrbDate(d) < new Date();
}

// Convert ISO "yyyy-mm-dd" to NRB format "dd/Month/yyyy"
function toNrbDate(isoDate) {
  if (!isoDate) return '';
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const d = new Date(isoDate);
  if (isNaN(d)) return isoDate;
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

module.exports = { norm, ageFrom, expired, parseNrbDate, toNrbDate };
