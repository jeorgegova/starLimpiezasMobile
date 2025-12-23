
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
      .select();

      console.log('Update user profile response:', { data, error });
      
    return { data, error };
  },

  // Cambiar rol de usuario (solo admin)
  async updateUserRole(userId, newRole) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.users)
      .update({ role: newRole })
      .eq('id', userId)
      .select();

    return { data, error };
  },

  // Obtener usuarios por rol
  async getUsersByRole(role) {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.users)
      .select(`
        id, 
        name, 
        email, 
        phone, 
        address, 
        role, 
        created_at,
        user_services(count)
      `)
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getUsersByRole:', error);
      return { data, error };
    }

    // Formatear el resultado para tener un campo total_services limpio
    const formattedData = (data || []).map(user => ({
      ...user,
      total_services: user.user_services?.[0]?.count || 0
    }));

    return { data: formattedData, error };
  },

  // Buscar usuarios por nombre, email o teléfono
  async searchUsers(query, role = null) {
    let supabaseQuery = supabase
      .from(DATABASE_CONFIG.tables.users)
      .select(`
        id, 
        name, 
        email, 
        phone, 
        address, 
        role, 
        created_at,
        user_services(count)
      `);

    if (role) {
      supabaseQuery = supabaseQuery.eq('role', role);
    }

    if (query.trim()) {
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`
      );
    }

    const { data, error } = await supabaseQuery.order('created_at', { ascending: false });

    if (error) {
      console.error('Error in searchUsers:', error);
      return { data, error };
    }

    // Formatear el resultado para tener un campo total_services limpio
    const formattedData = (data || []).map(user => ({
      ...user,
      total_services: user.user_services?.[0]?.count || 0
    }));

    return { data: formattedData, error };
  },

  // Crear nuevo usuario cliente (para admins)
  async createClient(clientData) {
    try {
      // Validar datos requeridos
      if (!clientData.name || !clientData.email || !clientData.password) {
        return { 
          success: false, 
          error: { message: 'Nombre, email y contraseña son requeridos' } 
        };
      }

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: clientData.email,
        password: clientData.password,
        options: {
          data: {
            name: clientData.name,
            role: DATABASE_CONFIG.roles.USER
          }
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return { success: false, error: authError };
      }

      // Si el usuario fue creado exitosamente, insertar perfil en tabla users
      if (authData?.user) {
        const userProfileData = {
          id: authData.user.id,
          password: clientData.password, // Agregar contraseña
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone || null,
          address: clientData.address || null,
          role: DATABASE_CONFIG.roles.USER,
          created_at: new Date().toISOString()
        };

        try {
          const { error: profileError } = await supabase
            .from(DATABASE_CONFIG.tables.users)
            .insert(userProfileData);

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Si falla la creación del perfil, intentar eliminar el usuario de auth
            await supabase.auth.admin.deleteUser(authData.user.id);
            return { success: false, error: profileError };
          }

          return { success: true, data: authData, error: null };
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
          return { success: false, error: profileError };
        }
      }

      return { success: false, error: { message: 'No se pudo crear el usuario' } };
    } catch (error) {
      console.error('CreateClient error:', error);
      return { success: false, error };
    }
  }
};
