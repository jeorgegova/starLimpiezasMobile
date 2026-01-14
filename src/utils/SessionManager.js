/**
 * Modern Session Storage Utility for Star Limpiezas Mobile
 * Ensures proper session persistence using AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const SESSION_KEY = 'star_limpiezas_session';
const USER_PROFILE_KEY = 'star_limpiezas_user_profile';

export class SessionManager {
  // Save session to AsyncStorage
  static async saveSession(session) {
    try {
      if (session) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        console.log('Session saved to AsyncStorage');
      } else {
        await AsyncStorage.removeItem(SESSION_KEY);
        console.log('Session removed from AsyncStorage');
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // Load session from AsyncStorage
  static async loadSession() {
    try {
      const sessionString = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionString) {
        const session = JSON.parse(sessionString);
        console.log('Session loaded from AsyncStorage');
        return session;
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
    return null;
  }

  // Save user profile to AsyncStorage
  static async saveUserProfile(profile) {
    try {
      if (profile) {
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
        console.log('User profile saved to AsyncStorage');
      } else {
        await AsyncStorage.removeItem(USER_PROFILE_KEY);
        console.log('User profile removed from AsyncStorage');
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  // Load user profile from AsyncStorage
  static async loadUserProfile() {
    try {
      const profileString = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (profileString) {
        const profile = JSON.parse(profileString);
        console.log('User profile loaded from AsyncStorage');
        return profile;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
    return null;
  }

  // Clear all session data
  static async clearSession() {
    try {
      await AsyncStorage.multiRemove([SESSION_KEY, USER_PROFILE_KEY]);
      console.log('All session data cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Initialize session from stored data
  static async initializeSession() {
    try {
      // Load session from AsyncStorage first
      const storedSession = await this.loadSession();
      const storedProfile = await this.loadUserProfile();

      if (storedSession) {
        // Set the session in Supabase
        const { data, error } = await supabase.auth.setSession(storedSession);
        
        if (error) {
          console.error('Error setting session:', error);
          await this.clearSession();
          return { session: null, profile: null };
        }

        console.log('Session restored successfully');
        return { 
          session: data.session, 
          profile: storedProfile 
        };
      }

      return { session: null, profile: null };
    } catch (error) {
      console.error('Error initializing session:', error);
      return { session: null, profile: null };
    }
  }

  // Check if we have valid stored session
  static async hasValidSession() {
    try {
      const session = await this.loadSession();
      if (!session) return false;

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      return session.expires_at > now;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }
}

export default SessionManager;