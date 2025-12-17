/**
 * Configuración de Supabase para Star Limpiezas Mobile
 * Sistema con roles: admin y user
 * IMPORTANTE: Reemplaza estos valores con tus credenciales reales de Supabase
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@env';

// Configuración principal de Supabase
export const SUPABASE_CONFIG = {
  url: SUPABASE_URL || 'https://your-project-id.supabase.co',
  anonKey: SUPABASE_ANON_KEY || 'your-anon-key-here',
  serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here'
};

// Configuración de la base de datos según la estructura proporcionada
export const DATABASE_CONFIG = {
  // Tablas principales que usaremos
  tables: {
    users: 'users',
    user_services: 'user_services',
    available_dates: 'available_dates',
    customer_loyalty: 'customer_loyalty',
    location: 'location',
    service_discount_config: 'service_discount_config',
    service_available: 'service_available'
  },
  
  // ROLES del sistema
  roles: {
    ADMIN: 'admin',
    USER: 'user'
  },
  
  // Estados de servicios
  serviceStatus: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed'
  },
  
  // Shifts disponibles
  shifts: {
    MORNING: 'morning',
    AFTERNOON: 'afternoon'
  },

  // Tipos de servicios de limpieza
  serviceTypes: {
    RESIDENTIAL: 'Limpieza Residencial',
    COMMERCIAL: 'Limpieza Comercial',
    OFFICE: 'Limpieza de Oficinas',
    POST_CONSTRUCTION: 'Limpieza Post-Obra',
    WINDOW: 'Limpieza de Ventanas',
    CARPET: 'Limpieza de Alfombras',
    DEEP_CLEANING: 'Limpieza Profunda',
    MOVE_IN_OUT: 'Limpieza Mudanza'
  }
};

// Configuración de autenticación
export const AUTH_CONFIG = {
  providers: {
    email: true,
    google: false,
    facebook: false
  },
  sessionPersistance: true,
  autoRefresh: true,
  detectSessionInUrl: false
};

// Mensajes de error personalizados
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Credenciales incorrectas. Verifica tu email y contraseña.',
  USER_NOT_FOUND: 'Usuario no encontrado.',
  EMAIL_NOT_VERIFIED: 'Debes verificar tu email antes de iniciar sesión.',
  SIGNUP_DISABLED: 'El registro de usuarios está deshabilitado.',
  WEAK_PASSWORD: 'La contraseña es demasiado débil.',
  EMAIL_ALREADY_EXISTS: 'Este email ya está registrado.',
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  UNKNOWN_ERROR: 'Ocurrió un error inesperado.',
  FORM_VALIDATION: 'Por favor completa todos los campos correctamente.',
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden.',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 6 caracteres.',
  ACCESS_DENIED: 'No tienes permisos para realizar esta acción.',
  INSUFFICIENT_PERMISSIONS: 'Permisos insuficientes para acceder a esta sección.'
};

// Configuración de la app
export const APP_CONFIG = {
  name: 'Star Limpiezas Mobile',
  version: '1.0.0',
  primaryColor: '#3498db',
  secondaryColor: '#2ecc71',
  dangerColor: '#e74c3c',
  warningColor: '#f39c12',
  infoColor: '#3498db',
  successColor: '#27ae60'
};

// Configuración de permisos por rol
export const PERMISSIONS = {
  admin: {
    canManageUsers: true,
    canCreateServices: true,
    canConfirmServices: true,
    canCancelServices: true,
    canEditServices: true,
    canManageBonuses: true,
    canViewAllReports: true,
    canCreateBonuses: true,
    canModifyBonuses: true
  },
  user: {
    canManageUsers: false,
    canCreateServices: true,
    canConfirmServices: false,
    canCancelServices: false,
    canEditServices: false,
    canManageBonuses: false,
    canViewAllReports: false,
    canCreateBonuses: false,
    canModifyBonuses: false
  }
};

export default SUPABASE_CONFIG;