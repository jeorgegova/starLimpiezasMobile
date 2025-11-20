/**
 * Modernized Navigator for Star Limpiezas Mobile
 * Role-based navigation with elegant animations
 */
import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../services/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ServiciosScreen from '../screens/ServiciosScreen';
import ClientesScreen from '../screens/ClientesScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import BonificationsScreen from '../screens/BonificationsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SimpleLoadingScreen from '../components/SimpleLoadingScreen';
import { modernTheme } from '../theme/ModernTheme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Modern tab navigator for Admin
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home-sharp' : 'home-outline';
              break;
            case 'Servicios':
              iconName = focused ? 'sparkles-sharp' : 'sparkles-outline';
              break;
            case 'Clientes':
              iconName = focused ? 'people-sharp' : 'people-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          // We'll use text-based icons for now and replace with proper icons later
          return <Text style={{ fontSize: size, color }}>★</Text>;
        },
        tabBarActiveTintColor: modernTheme.colors.primary,
        tabBarInactiveTintColor: modernTheme.colors.text.muted,
        tabBarStyle: {
          backgroundColor: modernTheme.colors.surface.primary,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: modernTheme.colors.text.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 80,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false, // We don't want headers in tab navigator
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen
        name="Servicios"
        component={ServiciosScreen}
        options={{
          tabBarLabel: 'Servicios',
        }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientesScreen}
        options={{
          tabBarLabel: 'Clientes',
        }}
      />
    </Tab.Navigator>
  );
};

// Modern tab navigator for Users
const UserTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home-sharp' : 'home-outline';
              break;
            case 'Servicios':
              iconName = focused ? 'sparkles-sharp' : 'sparkles-outline';
              break;
            case 'Perfil':
              iconName = focused ? 'person-sharp' : 'person-outline';
              break;
            case 'Reportes':
              iconName = focused ? 'bar-chart-sharp' : 'bar-chart-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          // We'll use text-based icons for now and replace with proper icons later
          return <Text style={{ fontSize: size, color }}>★</Text>;
        },
        tabBarActiveTintColor: modernTheme.colors.primary,
        tabBarInactiveTintColor: modernTheme.colors.text.muted,
        tabBarStyle: {
          backgroundColor: modernTheme.colors.surface.primary,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: modernTheme.colors.text.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 80,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false, // We don't want headers in tab navigator
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen
        name="Servicios"
        component={ServiciosScreen}
        options={{
          tabBarLabel: 'Servicios',
        }}
      />
      <Tab.Screen
        name="Reportes"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reportes',
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={UserProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

// Main app navigator with modern animations
const AppNavigator = () => {
  const { isAuthenticated, loading, initializing, isAdmin, isUser } = useAuth();

  // Show loading during initialization
  if (initializing || loading) {
    return <SimpleLoadingScreen message="Iniciando aplicación..." />;
    return null; // Auth context will handle loading screen
  }

  return (
    <NavigationContainer
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: modernTheme.colors.background.primary },
          gestureEnabled: true,
        }}
      >
        {!isAuthenticated ? (
          // Authentication stack
          <Stack.Screen
            name="Auth"
            component={LoginScreen}
            options={{
              title: 'Star Limpiezas',
            }}
          />
        ) : (
          // Main stack based on role
          <>
            {isAdmin() && (
              <Stack.Screen
                name="AdminMain"
                component={AdminTabNavigator}
                options={{
                  title: 'Star Limpiezas - Admin',
                }}
              />
            )}
            {isUser() && (
              <Stack.Screen
                name="UserMain"
                component={UserTabNavigator}
                options={{
                  title: 'Star Limpiezas - Usuario',
                }}
              />
            )}
            {/* Additional screens accessible from main stack */}
            <Stack.Screen
              name="AdminUsers"
              component={AdminUsersScreen}
              options={{
                title: 'Gestión de Usuarios',
              }}
            />
            <Stack.Screen
              name="Bonifications"
              component={BonificationsScreen}
              options={{
                title: 'Gestión de Bonificaciones',
              }}
            />
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{
                title: 'Reportes',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;