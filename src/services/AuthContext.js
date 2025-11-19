/**
 * Contexto de Autenticación mejorado para Star Limpiezas Mobile
 * Sistema con roles: admin y user + persistencia de sesión
 *
 * 🔐 SISTEMA DE AUTENTICACIÓN:
 * 1. Registro: Crea cuenta en Supabase Auth + inserta perfil en tabla 'users'
 * 2. Login: Valida contra Supabase Auth + carga perfil desde tabla 'users'
 * 3. Roles: Se obtienen desde tabla 'users' (NO de metadatos de auth)
 * 4. Persistencia: Sesión guardada en AsyncStorage para mantener login
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
import SessionManager from '../utils/SessionManager';

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
    // Initialize authentication with session persistence
    initializeAuthWithPersistence();

    // Listen for authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');

        setSession(session);
        setUser(session?.user ?? null);

        // Save session to AsyncStorage for persistence
        if (session) {
          await SessionManager.saveSession(session);
        } else {
          await SessionManager.saveSession(null);
        }

        // Load user profile when authentication changes
        if (session?.user) {
          await loadUserProfile(session.user.id, session);
        } else {
          setUserProfile(null);
          await SessionManager.saveUserProfile(null);
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

  // Helper function to add timeout to promises
  const withTimeout = (promise, timeoutMs = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      )
    ]);
  };

  const initializeAuthWithPersistence = async () => {
    try {
      setLoading(true);
      console.log('Initializing auth with session persistence...');

      // Try to restore session from AsyncStorage first
      const { session: restoredSession, profile: restoredProfile } = await SessionManager.initializeSession();

      if (restoredSession && restoredSession.user) {
        console.log('Session restored from storage');
        setSession(restoredSession);
        setUser(restoredSession.user);

        if (restoredProfile) {
          setUserProfile(restoredProfile);
          console.log('User profile restored from storage');
        } else {
          // If no profile stored, load it
          await loadUserProfile(restoredSession.user.id, restoredSession);
        }
      } else {
        console.log('No valid session found, checking current Supabase session...');

        try {
          // Get current session from Supabase with timeout
          const { data: { session: currentSession } } = await withTimeout(
            supabase.auth.getSession(),
            8000 // 8 second timeout
          );
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            await loadUserProfile(currentSession.user.id, currentSession);
          }
        } catch (sessionError) {
          console.warn('Failed to get Supabase session (timeout/network issue):', sessionError.message);
          // Continue without session - user will need to login
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
      }

    } catch (error) {
      console.error('Error initializing auth:', error);
      // Don't throw error, just continue without authentication
    } finally {
      // Ensure loading is always set to false
      setLoading(false);
      setInitializing(false);
    }
  };

  const loadUserProfile = async (userId, currentSession = null) => {
    try {
      console.log('Loading user profile for:', userId);

      const sessionToUse = currentSession || session;
      const currentUser = sessionToUse?.user;

      // First try to get from stored data
      const storedProfile = await SessionManager.loadUserProfile();

      try {
        // 🔐 AUTENTICACIÓN: Consultar tabla 'users' para obtener perfil completo
        // El 'userId' es el ID de Supabase Auth, debe coincidir con el ID en tabla users
        const { data, error } = await withTimeout(
          supabase
            .from(DATABASE_CONFIG.tables.users)
            .select('id, name, email, phone, address, role, created_at')
            .eq('id', userId)
            .single(),
          5000 // 5 second timeout for database queries
        );

        if (error) {
          console.error('Error loading user profile from database:', error);
          // Use stored profile as fallback, or create basic profile
          const profileToUse = storedProfile || {
            id: userId,
            name: currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Usuario',
            email: currentUser?.email || '',
            phone: null,
            address: null,
            role: DATABASE_CONFIG.roles.USER,
            created_at: new Date().toISOString()
          };
          setUserProfile(profileToUse);
          await SessionManager.saveUserProfile(profileToUse);
          return;
        }

        // Use the data from the database
        console.log('User profile loaded from database:', data.name);
        setUserProfile(data);

        // Save to AsyncStorage for persistence
        await SessionManager.saveUserProfile(data);

      } catch (dbError) {
        console.error('Database query failed, using fallback:', dbError);

        // Fallback to stored profile or basic profile
        const fallbackProfile = storedProfile || {
          id: userId,
          name: currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Usuario',
          email: currentUser?.email || '',
          phone: null,
          address: null,
          role: DATABASE_CONFIG.roles.USER,
          created_at: new Date().toISOString()
        };

        setUserProfile(fallbackProfile);
        await SessionManager.saveUserProfile(fallbackProfile);
      }

    } catch (error) {
      console.error('Error loading user profile:', error);

      // Ultimate fallback - basic profile
      const basicProfile = {
        id: userId,
        name: 'Usuario',
        email: session?.user?.email || '',
        role: DATABASE_CONFIG.roles.USER
      };

      setUserProfile(basicProfile);
      await SessionManager.saveUserProfile(basicProfile);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);

      // Create authentication account
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

      // If account created successfully, insert data into users table
      if (data?.user) {
        const userProfileData = {
          id: data.user.id,
          name: userData.name || data.user.email?.split('@')[0] || 'Usuario',
          email: email,
          phone: userData.phone || null,
          address: userData.address || null,
          role: userData.role || DATABASE_CONFIG.roles.USER,
          created_at: new Date().toISOString()
        };

        try {
          const { error: profileError } = await supabase
            .from(DATABASE_CONFIG.tables.users)
            .insert(userProfileData);

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Don't fail the complete registration for this, but log the error
          }
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
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
        // Load user profile after successful login
        await loadUserProfile(data.user.id, data.session);

        // Simple success message
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

      // Clear local state
      setUser(null);
      setSession(null);
      setUserProfile(null);

      // Clear stored session data
      await SessionManager.clearSession();

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

      // Update local profile
      const updatedProfile = { ...userProfile, ...profileData };
      setUserProfile(updatedProfile);
      
      // Save updated profile to AsyncStorage
      await SessionManager.saveUserProfile(updatedProfile);

      Alert.alert('Éxito', 'Perfil actualizado exitosamente');
      return { success: true, data, error: null };
    } catch (error) {
      console.error('UpdateProfile error:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el perfil');
      return { success: false, error };
    }
  };

  // Get current user permissions
  const getUserPermissions = () => {
    if (!userProfile) return {};
    
    const userRole = userProfile.role;
    return PERMISSIONS[userRole] || PERMISSIONS.user;
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    const permissions = getUserPermissions();
    return permissions[permission] || false;
  };

  // Check if user is admin
  const isAdmin = () => {
    return userProfile?.role === DATABASE_CONFIG.roles.ADMIN;
  };

  // Check if user is normal user
  const isUser = () => {
    return userProfile?.role === DATABASE_CONFIG.roles.USER;
  };

  const value = {
    // State
    user,
    session,
    loading,
    initializing,
    userProfile,
    
    // Authentication methods
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateUserProfile,
    initializeAuth: initializeAuthWithPersistence,
    
    // Role and permission utilities
    isAdmin,
    isUser,
    hasPermission,
    getUserPermissions,
    
    // User information utilities
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