/**
 * Navegador principal para Star Limpiezas Mobile
 * Navegación basada en roles: admin y user
 */
import React from 'react';
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
import Ionicons from '@react-native-vector-icons/ionicons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador de pestañas para Admin
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Servicios':
              iconName = focused ? 'construct' : 'construct-outline';
              break;
            case 'Clientes':
              iconName = focused ? 'people' : 'people-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#3498db',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio Admin',
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen
        name="Servicios"
        component={ServiciosScreen}
        options={{
          title: '🧹 Gestión de Servicios',
          tabBarLabel: 'Servicios',
        }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientesScreen}
        options={{
          title: '👥 Clientes',
          tabBarLabel: 'Clientes',
        }}
      />
    </Tab.Navigator>
  );
};

// Navegador de pestañas para User
const UserTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Servicios':
              iconName = focused ? 'construct' : 'construct-outline';
              break;
            case 'Perfil':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'Reportes':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#3498db',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio Usuario',
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen
        name="Servicios"
        component={ServiciosScreen}
        options={{
          title: '🧹 Mis Servicios',
          tabBarLabel: 'Servicios',
        }}
      />
      <Tab.Screen
        name="Reportes"
        component={ReportsScreen}
        options={{
          title: '📊 Mis Reportes',
          tabBarLabel: 'Reportes',
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={UserProfileScreen}
        options={{
          title: '👤 Mi Perfil',
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

// Navegador principal de la aplicación
const AppNavigator = () => {
  const { isAuthenticated, loading, initializing, isAdmin, isUser } = useAuth();

  // Mostrar loading durante la inicialización
  if (initializing || loading) {
    return null; // El contexto manejará la pantalla de loading
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3498db',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          // Stack de autenticación
          <Stack.Screen
            name="Auth"
            component={LoginScreen}
            options={{
              headerShown: false,
              title: 'Star Limpiezas',
            }}
          />
        ) : (
          // Stack principal basado en rol
          <>
            {isAdmin() && (
              <Stack.Screen
                name="AdminMain"
                component={AdminTabNavigator}
                options={{
                  headerShown: false,
                  title: 'Star Limpiezas - Admin',
                }}
              />
            )}
            {isUser() && (
              <Stack.Screen
                name="UserMain"
                component={UserTabNavigator}
                options={{
                  headerShown: false,
                  title: 'Star Limpiezas - Usuario',
                }}
              />
            )}
            {/* Pantallas adicionales accesibles desde el stack */}
            <Stack.Screen
              name="AdminUsers"
              component={AdminUsersScreen}
              options={{
                title: '👥 Administración de Usuarios',
              }}
            />
            <Stack.Screen
              name="Bonifications"
              component={BonificationsScreen}
              options={{
                title: '🎁 Gestión de Bonificaciones',
              }}
            />
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{
                title: '📊 Reportes',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;