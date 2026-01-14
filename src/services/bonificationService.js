import { supabase } from '../lib/supabase';
import { DATABASE_CONFIG } from './supabaseConfig';

/**
 * Servicios para gestión de bonificaciones y lealtad
 */
export const bonificationService = {
  // === CUSTOMER_LOYALTY ===

  // Obtener programas de lealtad
  async getLoyaltyPrograms(userId = null) {
    let query = supabase
      .from(DATABASE_CONFIG.tables.customer_loyalty)
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    return { data, error };
  },

  // Crear programa de lealtad
  async createLoyaltyProgram(loyaltyData) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.customer_loyalty)
      .insert({
        ...loyaltyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  },

  // Actualizar programa de lealtad
  async updateLoyaltyProgram(loyaltyId, loyaltyData) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.customer_loyalty)
      .update({
        ...loyaltyData,
        updated_at: new Date().toISOString()
      })
      .eq('id', loyaltyId)
      .select()
      .single();

    return { data, error };
  },

  // Eliminar programa de lealtad
  async deleteLoyaltyProgram(loyaltyId) {
    const { error } = await supabase
      .from(DATABASE_CONFIG.tables.customer_loyalty)
      .delete()
      .eq('id', loyaltyId);

    return { error };
  },

  // === SERVICE_DISCOUNT_CONFIG ===

  // Obtener configuraciones de descuento
  async getDiscountConfigs() {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.service_discount_config)
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Crear configuración de descuento
  async createDiscountConfig(configData) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.service_discount_config)
      .insert({
        ...configData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  },

  // Actualizar configuración de descuento
  async updateDiscountConfig(configId, configData) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.service_discount_config)
      .update({
        ...configData,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId)
      .select()
      .single();

    return { data, error };
  },

  // Eliminar configuración de descuento
  async deleteDiscountConfig(configId) {
    const { error } = await supabase
      .from(DATABASE_CONFIG.tables.service_discount_config)
      .delete()
      .eq('id', configId);

    return { error };
  },

  // === UTILIDADES ===

  // Calcular puntos de lealtad para un usuario
  async calculateUserLoyalty(userId) {
    const { data: services, error } = await supabase
      .from(DATABASE_CONFIG.tables.user_services)
      .select('status, service_name')
      .eq('user_id', userId)
      .eq('status', DATABASE_CONFIG.serviceStatus.COMPLETED);

    if (error) return { points: 0, error };

    // Lógica simple: 10 puntos por servicio completado
    const points = (services?.length || 0) * 10;

    return { points, services: services?.length || 0, error: null };
  },

  // Aplicar descuento basado en configuración
  async getApplicableDiscount(userId, serviceType) {
    // Obtener puntos de lealtad del usuario
    const { data: loyalty } = await this.getLoyaltyPrograms(userId);
    const userPoints = loyalty?.[0]?.points || 0;

    // Buscar configuraciones de descuento aplicables
    const { data: configs } = await this.getDiscountConfigs();

    if (!configs) return { discount: 0, config: null };

    // Encontrar la configuración que mejor aplique
    const applicableConfig = configs
      .filter(config =>
        config.service_type === serviceType &&
        config.active &&
        userPoints >= config.services_required
      )
      .sort((a, b) => b.discount_percentage - a.discount_percentage)[0];

    return {
      discount: applicableConfig?.discount_percentage || 0,
      config: applicableConfig || null
    };
  }
};