import { supabase } from '../lib/supabase';
import { DATABASE_CONFIG } from './supabaseConfig';

/**
 * Servicios de utilidad general
 */
export const utilityService = {
  // === LOCATIONS ===

  // Obtener todas las ubicaciones
  async getLocations() {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.location)
      .select('*')
      .order('location');

    return { data, error };
  },

  // Crear nueva ubicación
  async createLocation(locationData) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.location)
      .insert({
        ...locationData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  },

  // === AVAILABLE_DATES ===

  // Obtener fechas disponibles
  async getAvailableDates(service = null) {
    let query = supabase
      .from(DATABASE_CONFIG.tables.available_dates)
      .select('*');

    if (service) {
      query = query.eq('service', service);
    }

    const { data, error } = await query.order('start_date');

    return { data, error };
  },

  // Crear fecha disponible
  async createAvailableDate(dateData) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.available_dates)
      .insert({
        ...dateData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  },

  // === ESTADÍSTICAS Y REPORTES ===

  // Obtener estadísticas generales
  async getDashboardStats() {
    try {
      const [servicesResult, usersResult, locationsResult] = await Promise.all([
        supabase.from(DATABASE_CONFIG.tables.user_services).select('status', { count: 'exact' }),
        supabase.from(DATABASE_CONFIG.tables.users).select('role', { count: 'exact' }),
        supabase.from(DATABASE_CONFIG.tables.location).select('*', { count: 'exact' })
      ]);

      const stats = {
        totalServices: servicesResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalLocations: locationsResult.count || 0,
        servicesByStatus: {}
      };

      // Contar servicios por estado
      const { data: services } = await supabase
        .from(DATABASE_CONFIG.tables.user_services)
        .select('status');

      if (services) {
        services.forEach(service => {
          stats.servicesByStatus[service.status] = (stats.servicesByStatus[service.status] || 0) + 1;
        });
      }

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // === VALIDACIONES ===

  // Validar datos de servicio
  validateServiceData(serviceData) {
    const errors = [];

    if (!serviceData.service_name?.trim()) {
      errors.push('El nombre del servicio es obligatorio');
    }

    if (!serviceData.assigned_date) {
      errors.push('La fecha asignada es obligatoria');
    }

    if (!serviceData.user_id) {
      errors.push('El usuario es obligatorio');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validar datos de usuario
  validateUserData(userData) {
    const errors = [];

    if (!userData.name?.trim()) {
      errors.push('El nombre es obligatorio');
    }

    if (!userData.email?.trim()) {
      errors.push('El email es obligatorio');
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.push('El email no tiene un formato válido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // === FORMATOS ===

  // Formatear fecha para display
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  },

  // Formatear fecha y hora
  formatDateTime(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  },

  // Obtener nombre display de estado
  getStatusDisplayName(status) {
    const statusMap = {
      [DATABASE_CONFIG.serviceStatus.PENDING]: 'Pendiente',
      [DATABASE_CONFIG.serviceStatus.CONFIRMED]: 'Confirmado',
      [DATABASE_CONFIG.serviceStatus.CANCELLED]: 'Cancelado',
      [DATABASE_CONFIG.serviceStatus.COMPLETED]: 'Completado'
    };

    return statusMap[status] || status;
  },

  // Obtener color para estado
  getStatusColor(status) {
    const colorMap = {
      [DATABASE_CONFIG.serviceStatus.PENDING]: '#f39c12',
      [DATABASE_CONFIG.serviceStatus.CONFIRMED]: '#2ecc71',
      [DATABASE_CONFIG.serviceStatus.CANCELLED]: '#e74c3c',
      [DATABASE_CONFIG.serviceStatus.COMPLETED]: '#3498db'
    };

    return colorMap[status] || '#7f8c8d';
  },

  // Obtener nombre display de turno
  getShiftDisplayName(shift) {
    const shiftMap = {
      [DATABASE_CONFIG.shifts.MORNING]: 'Mañana',
      [DATABASE_CONFIG.shifts.AFTERNOON]: 'Tarde',
      [DATABASE_CONFIG.shifts.EVENING]: 'Noche'
    };

    return shiftMap[shift] || shift;
  },

  // Obtener nombre display de rol
  getRoleDisplayName(role) {
    const roleMap = {
      [DATABASE_CONFIG.roles.ADMIN]: 'Administrador',
      [DATABASE_CONFIG.roles.USER]: 'Usuario'
    };

    return roleMap[role] || 'Usuario';
  }
};