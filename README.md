# Sistema de Gestión Administrativa - Peluquería

Sistema completo de autenticación, gestión de citas y facturación para panel administrativo.

## Características

### Autenticación
- 🔐 Autenticación segura con validación de credenciales
- 👤 Validación de rol: solo administradores pueden iniciar sesión
- ✅ Validación de estado de cuenta (activo/inactivo)
- 🎨 Interfaz moderna y responsive
- 📱 Diseño adaptable para móviles y tablets
- ⚡ Feedback visual con animaciones

### Gestión de Citas
- 📋 Ver todas las citas registradas
- ➕ Crear nuevas citas
- ✏️ Editar citas existentes
- 🗑️ Eliminar citas
- 👨‍💼 Asignar trabajadores a citas
- 🏷️ Gestión de estados de citas (Pendiente, Confirmada, En Proceso, Completada, Cancelada)
- 📅 Filtrado por fecha

### Gestión de Facturas y Pagos
- 🧾 Ver todas las facturas generadas
- ➕ Crear nuevas facturas vinculadas a citas
- ✏️ Editar facturas existentes
- 🗑️ Eliminar facturas
- 💳 Registrar múltiples métodos de pago (Efectivo, Tarjetas, Transferencia, PSE, Nequi, Daviplata)
- 💰 Cálculo de totales y formato de moneda
- 🔗 Vinculación automática con citas de servicios

### Reportes y Análisis
- 📊 Dashboard con estadísticas en tiempo real
- 📋 Reporte completo de servicios disponibles
- 📅 Reporte diario de citas y citas completadas
- 💵 Reporte de ventas con filtrado por fecha
- 📊 Tarjetas de métricas: Citas del día, Ventas totales, Facturas generadas
- 📥 Exportar reportes a CSV para análisis en Excel
- 📄 Exportar reportes a PDF para impresión
- 🔍 Filtros por fecha para análisis específicos

## Cómo usar

### Iniciar Sesión
1. Abre el archivo `index.html` en tu navegador
2. Ingresa tu correo electrónico y contraseña
3. El sistema validará:
   - Credenciales correctas
   - Rol de administrador
   - Estado activo de la cuenta
4. Si todo es correcto, serás redirigido al panel administrativo

### Gestionar Citas, Facturas y Reportes
1. En el panel administrativo, navega entre las pestañas **"📅 Citas"**, **"🧾 Facturas"** y **"📊 Reportes"**
2. Para **Citas**: Click en **"+ Nueva Cita"** para crear, **"✏️ Editar"** para modificar, **"🗑️ Eliminar"** para eliminar
3. Para **Facturas**: Click en **"+ Nueva Factura"** para crear una factura vinculada a una cita
4. Para **Reportes**: Selecciona una fecha y click en **"🔍 Generar Reporte"** para ver estadísticas
5. Exporta los reportes usando **"📥 Exportar CSV"** o **"📄 Exportar PDF"**

## Requisitos de la API

La aplicación consume las siguientes APIs:

### API de Usuarios
- **URL**: `https://apipeluqueria-1.onrender.com/api/usuarios`
- **Método**: GET
- **Formato**: JSON

### API de Citas
- **URL**: `https://apipeluqueria-1.onrender.com/api/citas`
- **Métodos**: GET, POST, PUT, DELETE
- **Formato**: JSON

### API de Facturas
- **URL**: `https://apipeluqueria-1.onrender.com/api/facturas`
- **Métodos**: GET, POST, PUT, DELETE
- **Formato**: JSON

### API de Servicios
- **URL**: `https://apipeluqueria-1.onrender.com/api/servicios`
- **Métodos**: GET
- **Formato**: JSON

### API de Reportes
- **URL**: `https://apipeluqueria-1.onrender.com/api/reportes`
- **Métodos**: GET
- **Formato**: JSON

### Estructura de Usuario

```json
{
  "id_usuario": 0,
  "nombre": "string",
  "correo": "string",
  "contrasena": "string",
  "telefono": "string",
  "rol": "administrador",
  "estado": "activo",
  "fecha_registro": "2025-10-31T03:56:36.754Z"
}
```

### Estructura de Cita

```json
{
  "id_cita": 0,
  "id_cliente": 0,
  "id_trabajador": 0,
  "id_servicio": 0,
  "fecha_cita": "2025-10-31T03:56:36.748Z",
  "hora_cita": "string",
  "estado": "string",
  "observaciones": "string",
  "fecha_creacion": "2025-10-31T03:56:36.748Z"
}
```

### Estructura de Factura

```json
{
  "id_factura": 0,
  "id_cita": 0,
  "total": 0,
  "metodo_pago": "string",
  "fecha_emision": "2025-10-31T03:56:36.749Z"
}
```

### Estructura de Servicio

```json
{
  "id_servicio": 0,
  "nombre_servicio": "string",
  "descripcion": "string",
  "precio": 0,
  "duracion_minutos": 0
}
```

### Estructura de Reporte

```json
{
  "id_reporte": 0,
  "tipo_reporte": "string",
  "fecha_generacion": "2025-10-31T03:56:36.753Z",
  "generado_por": 0
}
```

### Validaciones

**Autenticación:**
- **Rol**: Solo usuarios con `rol: "administrador"` pueden iniciar sesión
- **Estado**: La cuenta debe estar activa
- **Credenciales**: Correo y contraseña deben coincidir

**Citas:**
- **Campos requeridos**: ID Cliente, ID Trabajador, ID Servicio, Fecha, Hora, Estado
- **Estados disponibles**: Pendiente, Confirmada, En Proceso, Completada, Cancelada
- **Fecha**: No se permiten fechas pasadas

**Facturas:**
- **Campos requeridos**: ID Cita, Total, Método de Pago, Fecha de Emisión
- **Métodos de pago**: Efectivo, Tarjeta Débito, Tarjeta Crédito, Transferencia, PSE, Nequi, Daviplata
- **Validación**: Total debe ser mayor a 0, fecha no puede ser pasada

## Almacenamiento Local

Los datos del usuario autenticado se guardan en `localStorage` con la clave `adminUser`:

```javascript
{
  id: number,
  nombre: string,
  correo: string,
  telefono: string,
  rol: string,
  timestamp: string
}
```

## Estructura del Proyecto

```
PaginaWeb/
├── index.html         # Página de login
├── styles.css         # Estilos del login
├── script.js          # Lógica de autenticación
├── admin-panel.html   # Panel de gestión de citas
├── admin-styles.css   # Estilos del panel administrativo
├── admin-script.js    # Lógica CRUD de citas
└── README.md          # Este archivo
```

## Requerimientos Funcionales Implementados

### RF12: Gestión de Citas
✅ **Ver citas**: Listado completo con tabla interactiva  
✅ **Crear citas**: Formulario con validación completa  
✅ **Modificar citas**: Edición de todos los campos  
✅ **Eliminar citas**: Eliminación con confirmación  

### RF13: Asignación de Trabajadores
✅ **Asignar trabajadores**: Campo `id_trabajador` en formulario  
✅ **Modificar asignación**: Permitido en edición  
✅ **Validación**: ID de trabajador obligatorio  

### RF14: Generación de Facturas
✅ **Generar facturas**: Formulario completo con validación  
✅ **Vinculación con citas**: Campo `id_cita` obligatorio  
✅ **Cálculo de totales**: Validación de montos positivos  
✅ **Registro de pagos**: Almacenamiento de métodos de pago  

### RF15: Registro de Pagos
✅ **Registrar pagos**: Múltiples métodos de pago disponibles  
✅ **Almacenamiento**: Persistencia en base de datos  
✅ **Edición**: Modificación de pagos registrados  
✅ **Eliminación**: Eliminación con confirmación  

### RF16: Reportes Diarios
✅ **Dashboard en tiempo real**: Estadísticas automáticas del día  
✅ **Servicios disponibles**: Catálogo completo de servicios  
✅ **Citas diarias**: Filtrado y visualización de citas por fecha  
✅ **Métricas**: Contadores de citas completadas y facturas generadas  
✅ **Análisis de ventas**: Suma total de ventas del día  

### RF17: Exportación de Reportes
✅ **Exportar CSV**: Descarga en formato Excel-compatible  
✅ **Exportar PDF**: Impresión y guardado de reportes completos  
✅ **Filtros por fecha**: Generación de reportes personalizados  
✅ **Estadísticas incluidas**: Métricas y tablas en exportación

## Próximos Pasos

- Agregar filtros de búsqueda (por fecha, estado, trabajador)
- Implementar calendario visual de citas
- Agregar reportes y estadísticas financieras
- Implementar impresión de facturas (PDF)
- Agregar historial de pagos por cliente
- Implementar control de facturas vs citas pendientes
- Agregar gestión de clientes y trabajadores
- Implementar tokens de autenticación más seguros

## Notas de Seguridad

⚠️ **Importante**: Este es un prototipo básico. Para producción, considera:

- Implementar JWT tokens
- Usar HTTPS en producción
- Encriptar contraseñas en el servidor
- Implementar rate limiting
- Agregar CAPTCHA para prevenir bots
- Usar variables de entorno para URLs de API

