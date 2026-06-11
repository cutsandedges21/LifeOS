// Admin identity — single source of truth on the client.
//
// The CLIENT uses isAdmin() to decide whether to render the Admin nav button
// and page. That is cosmetic only. The AUTHORITATIVE gate is the
// "read all profiles (admin)" RLS policy on profiles, which keys on this same
// email server-side, so a forged client check still reads zero foreign rows.
export const ADMIN_EMAIL = "sportsdude3133@gmail.com";

export function isAdmin(user) {
  return !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;
}
