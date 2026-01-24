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
import VectorIcon from '../theme/ModernIcon';
import { IconButton, StatusIcon } from '../theme/ModernIcon';

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
              iconName = 'home';
              break;
            case 'Servicios':
              iconName = 'cleaning';
              break;
            case 'Clientes':
              iconName = 'people';
              break;
            case 'Bonifications':
              iconName = 'bonus';
              break;
            case 'Reports':
              iconName = 'chart';
              break;
            default:
              iconName = 'home';
          }

          return <VectorIcon name={iconName} size={size} color={color} />;
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
          fontSize: 10,
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
      <Tab.Screen
        name="Bonifications"
        component={BonificationsScreen}
        options={{
          tabBarLabel: 'Bonificaciones',
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reportes',
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
              iconName = 'home';
              break;
            case 'Servicios':
              iconName = 'cleaning';
              break;
            case 'Perfil':
              iconName = 'person';
              break;
            case 'Reportes':
              iconName = 'chart';
              break;
            default:
              iconName = 'home';
          }

          return <VectorIcon name={iconName} size={size} color={color} />;
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
              cardStyle: { backgroundColor: 'transparent' },
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