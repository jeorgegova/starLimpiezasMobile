/**
 * Contexto de Autenticación mejorado para Star Limpiezas Mobile
 * Sistema con roles: admin y user
 *
 * 🔐 SISTEMA DE AUTENTICACIÓN:
 * 1. Registro: Crea cuenta en Supabase Auth + inserta perfil en tabla 'users'
 * 2. Login: Valida contra Supabase Auth + carga perfil desde tabla 'users'
 * 3. Roles: Se obtienen desde tabla 'users' (NO de metadatos de auth)
 *
 * 📋 TABLA 'users' requerida:
 * - id: UUID (debe coincidir con Supabase Auth ID)
 * - name, email, phone, address, role, created_at
 *
 * ⚠️ IMPORTANTE: Los roles se almacenan en la base de datos, no en metadatos
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { DATABASE_CONFIG, PERMISSIONS } from './supabaseConfig';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Obtener sesión inicial
    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);

        setSession(session);
        setUser(session?.user ?? null);

        // Cargar perfil de usuario cuando cambie la autenticación
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }

        if (!initializing) {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);

      // Obtener sesión actual
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // Cargar perfil de usuario
      if (currentSession?.user) {
        await loadUserProfile(currentSession.user.id);
      }

    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      // 🔐 AUTENTICACIÓN: Consultar tabla 'users' para obtener perfil completo
      // El 'userId' es el ID de Supabase Auth, debe coincidir con el ID en tabla users
      const { data, error } = await supabase
        .from(DATABASE_CONFIG.tables.users)
        .select('id, name, email, phone, address, role, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile from database:', error);
        // Si no existe en la tabla users, crear un perfil básico
        const basicProfile = {
          id: userId,
          name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario',
          email: user?.email || '',
          phone: null,
          address: null,
          role: DATABASE_CONFIG.roles.USER, // Rol por defecto
          created_at: new Date().toISOString()
        };
        setUserProfile(basicProfile);
        return;
      }

      // Usar los datos de la tabla users
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback básico en caso de error
      const fallbackProfile = {
        id: userId,
        name: user?.email?.split('@')[0] || 'Usuario',
        email: user?.email || '',
        role: DATABASE_CONFIG.roles.USER
      };
      setUserProfile(fallbackProfile);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);

      // Crear cuenta de autenticación
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || DATABASE_CONFIG.roles.USER
          }
        }
      });

      if (error) {
        Alert.alert('Error de Registro', error.message);
        return { success: false, data: null, error };
      }

      // Si la cuenta se creó exitosamente, insertar datos en tabla users
      if (data?.user) {
        const userProfileData = {
          id: data.user.id,
          name: userData.name || data.user.email?.split('@')[0] || 'Usuario',
          email: email,
          phone: userData.phone || null,
          address: userData.address || null,
          role: userData.role || DATABASE_CONFIG.roles.USER,
          password: password // Nota: En producción, no almacenar contraseña en texto plano
        };

        const { error: profileError } = await supabase
          .from(DATABASE_CONFIG.tables.users)
          .insert(userProfileData);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // No fallar el registro completo por esto, pero loguear el error
        }
      }

      if (data?.user && !data?.session) {
        Alert.alert(
          'Registro Exitoso',
          'Se ha enviado un email de confirmación. Por favor verifica tu correo antes de iniciar sesión.'
        );
      } else {
        Alert.alert('Éxito', '¡Cuenta creada exitosamente!');
      }

      return { success: true, data, error: null };
    } catch (error) {
      console.error('SignUp error:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado durante el registro');
      return { success: false, data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        Alert.alert('Error de Login', error.message);
        return { success: false, data: null, error };
      }

      if (data?.user) {
        // Cargar perfil del usuario después del login exitoso
        await loadUserProfile(data.user.id);

        // Mensaje de login exitoso simple
        Alert.alert('Éxito', 'Inicio de sesión exitoso');
      }

      return { success: true, data, error: null };
    } catch (error) {
      console.error('SignIn error:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado durante el login');
      return { success: false, data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        Alert.alert('Error', 'Error al cerrar sesión: ' + error.message);
        return { success: false, error };
      }

      // Limpiar estado local
      setUser(null);
      setSession(null);
      setUserProfile(null);

      Alert.alert('Éxito', 'Sesión cerrada exitosamente');
      return { success: true, error: null };
    } catch (error) {
      console.error('SignOut error:', error);
      Alert.alert('Error', 'Ocurrió un error al cerrar sesión');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'StarLimpiezasMobile://reset-password'
      });

      if (error) {
        Alert.alert('Error', error.message);
        return { success: false, error };
      }

      Alert.alert(
        'Email Enviado',
        'Se ha enviado un enlace para restablecer tu contraseña a tu email.'
      );
      return { success: true, error: null };
    } catch (error) {
      console.error('ResetPassword error:', error);
      Alert.alert('Error', 'Ocurrió un error al enviar el email');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        Alert.alert('Error', error.message);
        return { success: false, error };
      }

      Alert.alert('Éxito', 'Contraseña actualizada exitosamente');
      return { success: true, error: null };
    } catch (error) {
      console.error('UpdatePassword error:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar la contraseña');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      if (!userProfile) {
        return { success: false, error: { message: 'No hay perfil de usuario cargado' } };
      }

      const { data, error } = await supabase
        .from(DATABASE_CONFIG.tables.users)
        .update(profileData)
        .eq('id', userProfile.id)
        .select()
        .single();

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el perfil: ' + error.message);
        return { success: false, error };
      }

      // Actualizar el perfil local
      setUserProfile(prev => ({ ...prev, ...profileData }));

      Alert.alert('Éxito', 'Perfil actualizado exitosamente');
      return { success: true, data, error: null };
    } catch (error) {
      console.error('UpdateProfile error:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el perfil');
      return { success: false, error };
    }
  };

  // Obtener permisos del usuario actual
  const getUserPermissions = () => {
    if (!userProfile) return {};
    
    const userRole = userProfile.role;
    return PERMISSIONS[userRole] || PERMISSIONS.user;
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    const permissions = getUserPermissions();
    return permissions[permission] || false;
  };

  // Verificar si el usuario es admin
  const isAdmin = () => {
    return userProfile?.role === DATABASE_CONFIG.roles.ADMIN;
  };

  // Verificar si el usuario es user normal
  const isUser = () => {
    return userProfile?.role === DATABASE_CONFIG.roles.USER;
  };

  const value = {
    // Estado
    user,
    session,
    loading,
    initializing,
    userProfile,
    
    // Métodos de autenticación
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateUserProfile,
    initializeAuth,
    
    // Utilidades de roles y permisos
    isAdmin,
    isUser,
    hasPermission,
    getUserPermissions,
    
    // Utilidades de información del usuario
    isAuthenticated: !!user,
    isEmailVerified: !!user?.email_confirmed_at,
    userName: userProfile?.name || user?.email?.split('@')[0] || 'Usuario',
    userEmail: userProfile?.email || user?.email || '',
    userRole: userProfile?.role || DATABASE_CONFIG.roles.USER
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};