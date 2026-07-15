// Exact palette from the web app's own Staff Directory
// (frontend/src/pages/School_Admin/User_Management/TeacherList.jsx ROLE_COLORS) — role name pills
// use the same colors on both apps.
export const ROLE_COLORS = {
  teacher: '#14B8A6',
  'school admin': '#2563EB',
  principal: '#22C55E',
  'vice principal': '#22C55E',
  accountant: '#2563EB',
  staff: '#64748B',
  librarian: '#BE123C',
  'hostel warden': '#7C2D12',
  'transport manager': '#0E7490',
  receptionist: '#6D28D9',
};

export function roleColor(name = '', fallback = '#64748B') {
  return ROLE_COLORS[name.trim().toLowerCase()] ?? fallback;
}
