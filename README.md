# Star Limpiezas Mobile

Aplicación móvil para gestión de servicios de limpieza y administración de usuarios con sistema de roles (Admin/Cliente).
La app se enfoca en la administración de servicios, clientes y reportes, sin funcionalidad de citas.
Los usuarios con rol 'user' son los clientes que solicitan servicios de limpieza.

## 🚀 Características

### 👑 Administrador
- ✅ Gestión completa de usuarios (cambiar roles)
- ✅ Gestión de clientes (ver lista de usuarios registrados)
- ✅ Gestión de servicios (confirmar, cancelar, editar)
- ✅ Sistema de bonificaciones y descuentos
- ✅ Reportes avanzados con filtros de todos los servicios
- ✅ Panel de administración completo

### 👤 Usuario (Cliente)
- ✅ Solicitar servicios de limpieza (quedan pendientes de aprobación)
- ✅ Ver estado de servicios personales
- ✅ Gestionar perfil personal (name, phone, address)
- ✅ Reportes de servicios propios con filtros
- ✅ Registro automático al crear cuenta

## 🏗️ Arquitectura del Proyecto

```
starLimpiezasMobile/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Cliente Supabase configurado
│   ├── services/
│   │   ├── index.js             # Exportaciones centralizadas
│   │   ├── userService.js       # Servicios de usuarios
│   │   ├── serviceService.js    # Servicios de limpieza
│   │   ├── bonificationService.js # Bonificaciones y descuentos
│   │   ├── utilityService.js    # Utilidades y helpers
│   │   └── supabaseConfig.js    # Configuración y constantes
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ServiciosScreen.js
│   │   ├── AdminUsersScreen.js
│   │   ├── BonificationsScreen.js
│   │   ├── ReportsScreen.js
│   │   ├── UserProfileScreen.js
│   │   ├── ClientesScreen.js
│   │   ├── EmpleadosScreen.js
│   │   └── CitasScreen.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   └── services/
│       └── AuthContext.js
├── .env                          # Variables de entorno
└── package.json
```

## 🛠️ Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copiar `.env.example` a `.env` y completar con tus credenciales de Supabase:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Base de Datos
Asegúrate de que las siguientes tablas existan en tu base de datos Supabase:

#### Tabla `users` (Información del perfil del usuario)
```sql
create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  password text not null,
  name text not null,
  phone text null,
  email text null,
  address text null,
  created_at timestamp with time zone null default now(),
  role text null,
  constraint users_pkey primary key (id)
) TABLESPACE pg_default;
```

**Nota importante:** El `id` de la tabla `users` debe coincidir con el `id` de autenticación de Supabase Auth.

### 3. Instalar Node.js 20+
```bash
# Usando nvm (recomendado)
nvm install 20
nvm use 20
```

### 4. Ejecutar la aplicación
```bash
# Iniciar Metro bundler
npm start

# En otra terminal, ejecutar en dispositivo/emulador
npm run android  # o npm run ios
```

## 📊 Servicios Disponibles

### 🔐 Autenticación (`AuthContext.js`)
```javascript
import { useAuth } from '../services/AuthContext';

const { signIn, signOut, user, isAdmin, isUser } = useAuth();
```

### 👥 Gestión de Usuarios (`userService.js`)
```javascript
import { userService } from '../services';

const { data, error } = await userService.getUsers();
const { data, error } = await userService.updateUserProfile(userId, profileData);
```

### 🧹 Gestión de Servicios (`serviceService.js`)
```javascript
import { serviceService } from '../services';

const { data, error } = await serviceService.getUserServices(userId, isAdmin);
const { data, error } = await serviceService.createUserService(serviceData);
```

### 🎁 Bonificaciones (`bonificationService.js`)
```javascript
import { bonificationService } from '../services';

const { data, error } = await bonificationService.getLoyaltyPrograms(userId);
const { data, error } = await bonificationService.createDiscountConfig(configData);
```

### 🔧 Utilidades (`utilityService.js`)
```javascript
import { utilityService } from '../services';

const formattedDate = utilityService.formatDate(dateString);
const statusColor = utilityService.getStatusColor(status);
```

## 🎯 Base de Datos

### Tablas principales:
- `users` - Usuarios del sistema
- `user_services` - Servicios de limpieza
- `customer_loyalty` - Programa de lealtad
- `service_discount_config` - Configuración de descuentos
- `location` - Ubicaciones disponibles
- `available_dates` - Fechas disponibles

### Estados de servicios:
- `pending` - Pendiente de aprobación
- `confirmed` - Confirmado por admin
- `cancelled` - Cancelado
- `completed` - Completado

## 🔐 Sistema de Autenticación y Roles

### Cómo funciona la autenticación:

1. **Registro**: Se crea la cuenta en Supabase Auth + se inserta el perfil en tabla `users`
2. **Login**: Se valida contra Supabase Auth + se carga el perfil desde tabla `users`
3. **Roles**: Se obtienen desde la tabla `users` (no de metadatos de auth)

### Estructura de la tabla `users`:
```sql
- id: UUID (coincide con Supabase Auth ID)
- name: Nombre completo
- email: Correo electrónico
- phone: Teléfono (opcional)
- address: Dirección (opcional)
- role: 'admin' | 'user'
- created_at: Timestamp
```

### Roles disponibles:
- **`'admin'`**: Administrador completo del sistema
- **`'user'`**: Cliente que solicita servicios de limpieza

### Permisos por rol:
```javascript
const PERMISSIONS = {
  admin: {
    canManageUsers: true,      // Gestionar usuarios
    canCreateServices: true,   // Crear servicios
    canConfirmServices: true,  // Confirmar servicios
    canCancelServices: true,   // Cancelar servicios
    canEditServices: true,     // Editar servicios
    canManageBonuses: true,    // Gestionar bonificaciones
    canViewAllReports: true,   // Ver todos los reportes
    canCreateBonuses: true,    // Crear bonificaciones
    canModifyBonuses: true     // Modificar bonificaciones
  },
  user: {
    canManageUsers: false,     // ❌ No puede gestionar usuarios
    canCreateServices: true,   // ✅ Puede solicitar servicios (quedan pendientes)
    canConfirmServices: false, // ❌ No puede confirmar servicios
    canCancelServices: false,  // ❌ No puede cancelar servicios
    canEditServices: false,    // ❌ No puede editar servicios
    canManageBonuses: false,   // ❌ No puede gestionar bonificaciones
    canViewAllReports: false,  // ❌ Solo ve reportes de sus servicios
    canCreateBonuses: false,   // ❌ No puede crear bonificaciones
    canModifyBonuses: false    // ❌ No puede modificar bonificaciones
  }
};
```

## 🚀 Próximos Pasos

- [x] Migrar todas las pantallas a usar los nuevos servicios
- [ ] Implementar notificaciones push
- [ ] Agregar funcionalidad de calendario
- [ ] Implementar sistema de pagos
- [ ] Agregar modo offline

## 📝 Notas de Desarrollo

- **React Native 0.82.1** requiere **Node.js 20+**
- **Supabase JS** configurado específicamente para React Native
- **Navegación** basada en roles con diferentes experiencias de usuario
- **Arquitectura modular** con servicios separados por responsabilidad

## 🐛 Solución de Problemas

### Error: "Cannot assign to property 'protocol'"
- ✅ Solucionado con `react-native-url-polyfill/auto`

### Error: "configs.toReversed is not a function"
- ✅ Solucionado actualizando a Node.js 20+

### Error: "Supabase connection failed"
- ✅ Verificar variables de entorno en `.env`
- ✅ Confirmar que las tablas existen en Supabase

### Error: "Usuario no encontrado" al iniciar sesión
- ✅ Verificar que el usuario existe en la tabla `users`
- ✅ El `id` de la tabla `users` debe coincidir con el `id` de Supabase Auth
- ✅ El rol debe estar definido ('admin' o 'user')

### Error: "No tienes permisos" en ciertas secciones
- ✅ Verificar que el rol del usuario esté correctamente asignado en tabla `users`
- ✅ Los roles se obtienen de la base de datos, no de metadatos de auth

---

**Desarrollado con ❤️ para Star Limpiezas**
