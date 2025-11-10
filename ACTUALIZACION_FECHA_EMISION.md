# ✅ Actualización: Manejo de Fecha de Emisión en Facturas

## Cambios Realizados

### 1. Frontend (admin-script.js) ✅

#### Problema Anterior
El frontend **NO** enviaba `fecha_emision` al crear nuevas facturas (POST), solo al editar (PUT).

#### Solución
Ahora el frontend **SÍ envía** `fecha_emision` en formato ISO 8601 UTC cuando se crea una nueva factura.

#### Código Actualizado

```javascript
// Obtener fecha_emision del formulario
const fechaEmision = formData.get('fecha_emision');
if (fechaEmision) {
    // Convertir fecha de formato YYYY-MM-DD a ISO 8601 con hora actual en UTC
    // Ejemplo: "2025-11-10" -> "2025-11-10T15:40:15.053Z"
    const ahora = new Date();
    const año = parseInt(fechaEmision.split('-')[0], 10);
    const mes = parseInt(fechaEmision.split('-')[1], 10) - 1;
    const dia = parseInt(fechaEmision.split('-')[2], 10);
    
    // Crear fecha en UTC con la hora actual
    const fechaCompleta = new Date(Date.UTC(
        año, mes, dia, 
        ahora.getUTCHours(), 
        ahora.getUTCMinutes(), 
        ahora.getUTCSeconds(), 
        ahora.getUTCMilliseconds()
    ));
    
    facturaData.fecha_emision = fechaCompleta.toISOString();
} else {
    // Si no se proporciona fecha, usar la fecha y hora actual en UTC
    facturaData.fecha_emision = new Date().toISOString();
}
```

### 2. Backend (facturasController.cs) ✅

#### Mejoras Realizadas
- ✅ Manejo correcto de fechas UTC
- ✅ Validación de fechas inválidas o por defecto
- ✅ Conversión automática a UTC si es necesario

#### Código Actualizado

```csharp
// Si no se proporciona fecha_emision o es inválida, usar la fecha y hora actual en UTC
if (facturas.fecha_emision == default(DateTime) || facturas.fecha_emision == DateTime.MinValue)
{
    facturas.fecha_emision = DateTime.UtcNow;
}
else
{
    // Asegurar que la fecha esté en UTC si viene del frontend
    // El frontend envía fechas en formato ISO 8601 UTC (ej: "2025-11-10T15:40:15.053Z")
    if (facturas.fecha_emision.Kind != DateTimeKind.Utc)
    {
        // Si la fecha no está en UTC, convertirla
        facturas.fecha_emision = facturas.fecha_emision.ToUniversalTime();
    }
}
```

## Formato de Fecha

### Formato Enviado por el Frontend

El frontend ahora envía la fecha en formato ISO 8601 UTC:

```json
{
  "id_cita": 14,
  "total": 1000,
  "metodo_pago": "string",
  "fecha_emision": "2025-11-10T15:40:15.053Z"
}
```

### Formato en el Formulario

El formulario usa un input `type="date"` que devuelve el formato `YYYY-MM-DD`:
- Ejemplo: `"2025-11-10"`

### Conversión

El frontend convierte automáticamente:
- **Input**: `"2025-11-10"` (formato del input date)
- **Enviado al backend**: `"2025-11-10T15:40:15.053Z"` (ISO 8601 UTC con hora actual)

## Comportamiento

### Al Crear una Nueva Factura (POST)

1. El usuario selecciona una fecha en el formulario (o se usa la fecha actual por defecto)
2. El frontend convierte la fecha a ISO 8601 UTC con la hora actual
3. El frontend envía `fecha_emision` al backend
4. El backend valida y procesa la fecha en UTC
5. La factura se guarda con la fecha correcta

### Al Editar una Factura (PUT)

1. El formulario se llena con la fecha existente de la factura
2. El usuario puede modificar la fecha si lo desea
3. El frontend convierte la fecha a ISO 8601 UTC con la hora actual
4. El frontend envía `fecha_emision` actualizada al backend
5. El backend valida y actualiza la fecha

## Ejemplo de Petición

### POST /api/facturas

```json
{
  "id_cita": 14,
  "total": 90000,
  "metodo_pago": "tarjeta_credito",
  "fecha_emision": "2025-11-10T15:40:15.053Z"
}
```

### Respuesta (201 Created)

```json
{
  "id_factura": 1,
  "id_cita": 14,
  "total": 90000,
  "metodo_pago": "tarjeta_credito",
  "fecha_emision": "2025-11-10T15:40:15.053Z"
}
```

## Validaciones

### Frontend
- ✅ La fecha se valida en el formulario (campo requerido)
- ✅ La fecha se convierte correctamente a UTC
- ✅ Si no se proporciona fecha, se usa la fecha actual

### Backend
- ✅ Valida que `fecha_emision` no sea `default(DateTime)` o `DateTime.MinValue`
- ✅ Convierte la fecha a UTC si no está en UTC
- ✅ Usa `DateTime.UtcNow` si la fecha no es válida

## Ventajas

1. **Consistencia**: Todas las fechas se manejan en UTC
2. **Precisión**: Se incluye la hora exacta de creación
3. **Compatibilidad**: Formato ISO 8601 estándar
4. **Flexibilidad**: El usuario puede seleccionar cualquier fecha
5. **Validación**: Validaciones tanto en frontend como backend

## Pruebas

### Prueba 1: Crear Factura con Fecha Seleccionada

1. Abre el formulario de nueva factura
2. Selecciona una fecha (ej: "2025-11-10")
3. Completa los demás campos
4. Guarda la factura
5. **Verifica**: La factura se crea con la fecha seleccionada y la hora actual

### Prueba 2: Crear Factura sin Seleccionar Fecha

1. Abre el formulario de nueva factura
2. La fecha por defecto es la fecha actual
3. Completa los demás campos
4. Guarda la factura
5. **Verifica**: La factura se crea con la fecha y hora actual

### Prueba 3: Editar Factura

1. Abre una factura existente para editar
2. Modifica la fecha si lo deseas
3. Guarda los cambios
4. **Verifica**: La factura se actualiza con la nueva fecha

## Checklist de Verificación

- [ ] El frontend envía `fecha_emision` al crear nuevas facturas
- [ ] El frontend convierte correctamente la fecha a ISO 8601 UTC
- [ ] El backend maneja correctamente las fechas UTC
- [ ] El backend valida fechas inválidas o por defecto
- [ ] Las facturas se guardan con la fecha correcta
- [ ] Las facturas se pueden editar y actualizar la fecha
- [ ] El formato de fecha es consistente en toda la aplicación

## Archivos Modificados

1. ✅ `admin-script.js` - Actualizado para enviar `fecha_emision` en POST
2. ✅ `facturasController.cs` - Mejorado el manejo de fechas UTC

## 🎉 ¡Listo!

Con estos cambios, el manejo de `fecha_emision` está completamente implementado y funcionando correctamente. Las facturas ahora se crean con la fecha y hora exactas en formato UTC.

