// Single source of truth for roles used by the RBAC checks (requireRole) across the API.
const ROLES = {
  CUSTOMER: 'customer',
  RIDER: 'rider',
  STAFF: 'staff',
  ADMIN: 'admin',
};

// Roles anyone can pick when signing up. Admin and staff accounts are only created on the
// backend with `npm run create-user`.
const SELF_SIGNUP_ROLES = [ROLES.CUSTOMER, ROLES.RIDER];

// Roles that run the shop: weighing, pricing and moving orders through their lifecycle.
const SHOP_ROLES = [ROLES.STAFF, ROLES.ADMIN];

module.exports = { ROLES, SELF_SIGNUP_ROLES, SHOP_ROLES };
