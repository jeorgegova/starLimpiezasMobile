import { supabase } from '../lib/supabase';
import { DATABASE_CONFIG } from './supabaseConfig';

/**
 * Servicios para gestión de servicios de limpieza
 */
export const serviceService = {

  // Obtener servicios (con filtro por usuario si no es admin)
  async getUserServices(userId = null, isAdmin = false, filters = {}) {
    let query = supabase
      .from(DATABASE_CONFIG.tables.user_services)
      .select(`
        *,
        location:location(id, location),
        user:users(id, name, email)
      `);

    // Si no es admin, solo puede ver sus propios servicios
    if (!isAdmin && userId) {
      query = query.eq('user_id', userId);
    }

    // Aplicar filtros adicionales (nuevo parámetro filters)
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.service_type) {
      query = query.ilike('service_name', `%${filters.service_type}%`);
    }

    if (filters.date_from) {
      query = query.gte('assigned_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('assigned_date', filters.date_to);
    }

    const { data, error } = await query.order('assigned_date', { ascending: false });

    return { data, error };
  },

  // Crear nuevo servicio
  async createUserService(serviceData) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.user_services)
      .insert({
        ...serviceData,
        status: DATABASE_CONFIG.serviceStatus.PENDING,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  },

  // Actualizar estado del servicio (solo admin)
  async updateServiceStatus(serviceId, status) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.user_services)
      .update({ status })
      .eq('id', serviceId)
      .select()
      .single();

    return { data, error };
  },

  // Actualizar servicio completo
  async updateService(serviceId, serviceData) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.user_services)
      .update(serviceData)
      .eq('id', serviceId)
      .select()
      .single();

    return { data, error };
  },

  // Eliminar servicio (solo admin)
  async deleteService(serviceId) {
    const { error } = await supabase
      .from(DATABASE_CONFIG.tables.user_services)
      .delete()
      .eq('id', serviceId);

    return { error };
  },

  // Obtener servicios disponibles
  async getAvailableServices() {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.service_available)
      .select('*')
      .order('name');

    return { data, error };
  },

  // Obtener ubicaciones
  async getLocations() {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.location)
      .select('*')
      .order('location');

    return { data, error };
  },

  // Obtener servicios por filtros (para reportes)
  async getServicesByFilters(filters = {}) {
    let query = supabase
      .from(DATABASE_CONFIG.tables.user_services)
      .select(`
        *,
        location:location(id, location),
        user:users(id, name, email)
      `);

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.date_from) {
      query = query.gte('assigned_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('assigned_date', filters.date_to);
    }

    if (filters.service_type) {
      query = query.ilike('service_name', `%${filters.service_type}%`);
    }

    const { data, error } = await query.order('assigned_date', { ascending: false });

    return { data, error };
  }
};