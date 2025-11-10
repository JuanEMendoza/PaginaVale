# ✅ Validación Mejorada del Método PUT para Facturas

## Datos que se Envían en PUT

El frontend envía los siguientes datos al actualizar una factura:

```json
{
  "id_factura": 7,
  "id_cita": 14,
  "total": 100045,
  "metodo_pago": "stringer",
  "fecha_emision": "2025-11-10T16:33:25.945Z"
}
```

## Mejoras Implementadas en el Método PUT

### 1. Validaciones Completas ✅

El método PUT ahora valida todos los campos requeridos, igual que el método POST:

- ✅ Validación de objeto nulo
- ✅ Validación de ID coincidente
- ✅ Validación de `id_cita > 0`
- ✅ Validación de `total > 0`
- ✅ Validación de `metodo_pago` no vacío
- ✅ Validación de `fecha_emision` válida

### 2. Manejo Correcto de Fechas UTC ✅

El método PUT ahora maneja correctamente las fechas en formato ISO 8601 UTC:

```csharp
// Asegurar que la fecha esté en UTC si viene del frontend
// El frontend envía fechas en formato ISO 8601 UTC (ej: "2025-11-10T16:33:25.945Z")
if (facturas.fecha_emision.Kind != DateTimeKind.Utc)
{
    facturas.fecha_emision = facturas.fecha_emision.ToUniversalTime();
}
```

### 3. Actualización Segura ✅

En lugar de usar `EntityState.Modified` directamente, ahora:

1. **Carga la factura existente** desde la base de datos
2. **Actualiza solo los campos necesarios** (evita problemas de concurrencia)
3. **Valida que la factura exista** antes de actualizar

```csharp
// Verificar que la factura existe
var facturaExistente = await _context.facturas.FindAsync(id);
if (facturaExistente == null)
{
    return NotFound(new { message = $"La factura con ID {id} no existe" });
}

// Actualizar los campos de la factura existente
facturaExistente.id_cita = facturas.id_cita;
facturaExistente.total = facturas.total;
facturaExistente.metodo_pago = facturas.metodo_pago;
facturaExistente.fecha_emision = facturas.fecha_emision;
```

### 4. Manejo de Errores Mejorado ✅

El método PUT ahora maneja diferentes tipos de errores:

- ✅ `DbUpdateConcurrencyException` - Conflictos de concurrencia
- ✅ `DbUpdateException` - Errores de base de datos
- ✅ `Exception` - Errores inesperados

### 5. Respuesta Mejorada ✅

El método PUT ahora devuelve la factura actualizada en lugar de `NoContent()`:

- ✅ Código 200 OK con la factura actualizada
- ✅ Permite al frontend ver los valores actualizados
- ✅ Más útil que una respuesta vacía

## Comparación: Antes vs Después

### Antes
```csharp
// No tenía validaciones completas
// Usaba EntityState.Modified directamente
// Devolvía NoContent() sin cuerpo
_context.Entry(facturas).State = EntityState.Modified;
await _context.SaveChangesAsync();
return NoContent();
```

### Después
```csharp
// Validaciones completas
// Carga la entidad existente y actualiza campos específicos
// Manejo correcto de fechas UTC
// Devolver la factura actualizada
var facturaExistente = await _context.facturas.FindAsync(id);
facturaExistente.id_cita = facturas.id_cita;
facturaExistente.total = facturas.total;
facturaExistente.metodo_pago = facturas.metodo_pago;
facturaExistente.fecha_emision = facturas.fecha_emision;
await _context.SaveChangesAsync();
return Ok(facturaExistente);
```

## Validaciones Implementadas

### Validación de ID
```csharp
if (id != facturas.id_factura)
{
    return BadRequest(new { message = "El ID de la URL no coincide con el ID de la factura" });
}
```

### Validación de ID de Cita
```csharp
if (facturas.id_cita <= 0)
{
    return BadRequest(new { message = "El ID de la cita es requerido y debe ser mayor a 0" });
}
```

### Validación de Total
```csharp
if (facturas.total <= 0)
{
    return BadRequest(new { message = "El total debe ser mayor a 0" });
}
```

### Validación de Método de Pago
```csharp
if (string.IsNullOrWhiteSpace(facturas.metodo_pago))
{
    return BadRequest(new { message = "El método de pago es requerido" });
}
```

### Validación de Fecha de Emisión
```csharp
if (facturas.fecha_emision == default(DateTime) || facturas.fecha_emision == DateTime.MinValue)
{
    return BadRequest(new { message = "La fecha de emisión es requerida y debe ser válida" });
}
```

## Manejo de Fechas

### Formato de Entrada
El frontend envía fechas en formato ISO 8601 UTC:
```
"2025-11-10T16:33:25.945Z"
```

### Conversión a UTC
Si la fecha no está en UTC, se convierte automáticamente:
```csharp
if (facturas.fecha_emision.Kind != DateTimeKind.Utc)
{
    facturas.fecha_emision = facturas.fecha_emision.ToUniversalTime();
}
```

## Respuestas del Método PUT

### Éxito (200 OK)
```json
{
  "id_factura": 7,
  "id_cita": 14,
  "total": 100045,
  "metodo_pago": "stringer",
  "fecha_emision": "2025-11-10T16:33:25.945Z"
}
```

### Error de Validación (400 Bad Request)
```json
{
  "message": "El total debe ser mayor a 0"
}
```

### Factura No Encontrada (404 Not Found)
```json
{
  "message": "La factura con ID 7 no existe"
}
```

### Error del Servidor (500 Internal Server Error)
```json
{
  "message": "Error al actualizar la factura en la base de datos",
  "error": "Detalles del error..."
}
```

## Ventajas de la Implementación

1. ✅ **Validaciones completas** - Todos los campos son validados
2. ✅ **Manejo seguro de fechas** - Conversión automática a UTC
3. ✅ **Actualización segura** - Evita problemas de concurrencia
4. ✅ **Mensajes de error claros** - Fáciles de entender
5. ✅ **Respuesta útil** - Devuelve la factura actualizada
6. ✅ **Manejo de errores robusto** - Captura diferentes tipos de excepciones

## Pruebas

### Prueba 1: Actualizar Factura con Datos Válidos
```json
PUT /api/facturas/7
{
  "id_factura": 7,
  "id_cita": 14,
  "total": 100045,
  "metodo_pago": "stringer",
  "fecha_emision": "2025-11-10T16:33:25.945Z"
}
```
**Resultado esperado:** 200 OK con la factura actualizada

### Prueba 2: Actualizar Factura con Total Inválido
```json
PUT /api/facturas/7
{
  "id_factura": 7,
  "id_cita": 14,
  "total": 0,
  "metodo_pago": "stringer",
  "fecha_emision": "2025-11-10T16:33:25.945Z"
}
```
**Resultado esperado:** 400 Bad Request con mensaje de error

### Prueba 3: Actualizar Factura Inexistente
```json
PUT /api/facturas/999
{
  "id_factura": 999,
  "id_cita": 14,
  "total": 100045,
  "metodo_pago": "stringer",
  "fecha_emision": "2025-11-10T16:33:25.945Z"
}
```
**Resultado esperado:** 404 Not Found

## Checklist

- [x] Validaciones completas implementadas
- [x] Manejo correcto de fechas UTC
- [x] Actualización segura de entidades
- [x] Manejo de errores robusto
- [x] Respuesta con factura actualizada
- [x] Mensajes de error claros
- [ ] Probar en producción después de redesplegar

## 🎉 ¡Listo!

El método PUT ahora está completamente implementado con validaciones robustas y manejo correcto de todos los campos, incluyendo la fecha en formato ISO 8601 UTC.

