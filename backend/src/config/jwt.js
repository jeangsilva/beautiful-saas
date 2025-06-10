// ===========================
// backend/src/config/jwt.js (2/4)
// ===========================
require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'beautiful_secret_key_change_in_production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'beautiful_refresh_secret_key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Algoritmo de assinatura
  algorithm: 'HS256',
  
  // Issuer
  issuer: 'Beautiful SaaS by Olivyx',
  
  // Audience
  audience: 'beautiful-users',
  
  // Claims customizados
  generatePayload: (user) => ({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.company_id,
    companySlug: user.company?.slug || null,
    permissions: getRolePermissions(user.role)
  })
};

// Definir permissões por role
function getRolePermissions(role) {
  const permissions = {
    'super_admin': ['*'],
    'company_admin': [
      'company.manage',
      'users.manage',
      'services.manage',
      'bookings.manage',
      'customers.manage',
      'reports.view',
      'settings.manage',
      'billing.view'
    ],
    'professional': [
      'bookings.view_own',
      'bookings.update_own',
      'customers.view',
      'schedule.manage_own',
      'profile.manage_own'
    ],
    'receptionist': [
      'bookings.create',
      'bookings.view',
      'bookings.update',
      'customers.create',
      'customers.view',
      'customers.update'
    ]
  };

  return permissions[role] || [];
}