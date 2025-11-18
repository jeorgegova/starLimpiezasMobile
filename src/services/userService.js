import { supabase } from '../lib/supabase';
import { DATABASE_CONFIG } from './supabaseConfig';

/**
 * Servicios para gestión de usuarios
 */
export const userService = {
  // Obtener todos los usuarios (solo admin)
  async getUsers() {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.users)
      .select('id, name, email, phone, address, role, created_at')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Obtener perfil de usuario específico
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.users)
      .select('id, name, email, phone, address, role, created_at')
      .eq('id', userId)
      .single();

    return { data, error };
  },

  // Actualizar perfil de usuario
  async updateUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.users)
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Cambiar rol de usuario (solo admin)
  async updateUserRole(userId, newRole) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.users)
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Obtener usuarios por rol
  async getUsersByRole(role) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.users)
      .select('id, name, email, phone, address, role, created_at')
      .eq('role', role)
      .order('created_at', { ascending: false });

    return { data, error };
  }
};