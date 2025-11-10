# 🔍 Verificación del Modelo de Facturas

## Datos que Envía el Frontend

El frontend envía los siguientes datos al crear una factura:

```json
{
  "id_cita": 14,
  "total": 90000,
  "metodo_pago": "tarjeta_credito"
}
```

**Nota:** Para nuevas facturas (POST), el frontend NO envía `id_factura` ni `fecha_emision` porque:
- `id_factura` es autoincremental (lo genera la base de datos)
- `fecha_emision` debe ser generada por el backend (fecha actual)

## Modelo Requerido en el Backend

Tu modelo `facturas` debe tener las siguientes propiedades:

```csharp
public class facturas
{
    public int id_factura { get; set; }        // Auto-incremental, NO se envía en POST
    public int id_cita { get; set; }           // ✅ REQUERIDO - Se envía desde el frontend
    public decimal total { get; set; }          // ✅ REQUERIDO - Se envía desde el frontend
    public string metodo_pago { get; set; }     // ✅ REQUERIDO - Se envía desde el frontend
    public DateTime fecha_emision { get; set; } // Opcional - Se genera en el backend si no se envía
}
```

## Verificaciones Necesarias

### 1. Verifica el Nombre de las Propiedades

Las propiedades del modelo deben coincidir EXACTAMENTE con los nombres que envía el frontend:

- ✅ `id_cita` (no `IdCita` ni `Id_Cita`)
- ✅ `total` (no `Total`)
- ✅ `metodo_pago` (no `MetodoPago` ni `Metodo_Pago`)
- ✅ `fecha_emision` (no `FechaEmision` ni `Fecha_Emision`)

### 2. Verifica los Tipos de Datos

- `id_cita`: `int` (coincide con el frontend que envía número)
- `total`: `decimal` o `double` (coincide con el frontend que envía número)
- `metodo_pago`: `string` (coincide con el frontend que envía texto)
- `fecha_emision`: `DateTime` (se genera en el backend si no se envía)

### 3. Verifica la Configuración de la Base de Datos

Asegúrate de que en tu `contextDB`:

```csharp
public DbSet<facturas> facturas { get; set; }
```

Y que el modelo esté configurado correctamente en `OnModelCreating` si es necesario:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<facturas>(entity =>
    {
        entity.HasKey(e => e.id_factura);
        entity.Property(e => e.id_factura)
              .ValueGeneratedOnAdd(); // Auto-incremental
        
        entity.Property(e => e.id_cita)
              .IsRequired();
        
        entity.Property(e => e.total)
              .HasColumnType("decimal(18,2)") // Ajusta según tu BD
              .IsRequired();
        
        entity.Property(e => e.metodo_pago)
              .HasMaxLength(50)
              .IsRequired();
        
        entity.Property(e => e.fecha_emision)
              .IsRequired();
    });
}
```

## Ejemplo Completo del Modelo

```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiPeluqueria.Models
{
    [Table("facturas")]  // Nombre de la tabla en la base de datos
    public class facturas
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id_factura { get; set; }

        [Required]
        public int id_cita { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal total { get; set; }

        [Required]
        [StringLength(50)]
        public string metodo_pago { get; set; }

        [Required]
        public DateTime fecha_emision { get; set; }

        // Relación opcional con Cita
        // [ForeignKey("id_cita")]
        // public virtual citas cita { get; set; }
    }
}
```

## Validación en el Controlador

El controlador que creamos ya incluye validaciones para:

- ✅ Verificar que `id_cita > 0`
- ✅ Verificar que `total > 0`
- ✅ Verificar que `metodo_pago` no sea nulo o vacío
- ✅ Generar `fecha_emision` automáticamente si no se proporciona

## Pruebas

### Prueba 1: Crear Factura con Datos Mínimos

```json
POST /api/facturas
Content-Type: application/json

{
  "id_cita": 1,
  "total": 50000,
  "metodo_pago": "efectivo"
}
```

**Resultado esperado:**
- Status: 201 Created
- Body: Factura creada con `id_factura` y `fecha_emision` generados

### Prueba 2: Crear Factura con Fecha Explícita

```json
POST /api/facturas
Content-Type: application/json

{
  "id_cita": 1,
  "total": 50000,
  "metodo_pago": "efectivo",
  "fecha_emision": "2024-01-15T10:30:00"
}
```

**Resultado esperado:**
- Status: 201 Created
- Body: Factura creada con la fecha proporcionada

### Prueba 3: Error - ID de Cita Inválido

```json
POST /api/facturas
Content-Type: application/json

{
  "id_cita": 0,
  "total": 50000,
  "metodo_pago": "efectivo"
}
```

**Resultado esperado:**
- Status: 400 Bad Request
- Body: `{ "message": "El ID de la cita es requerido y debe ser mayor a 0" }`

### Prueba 4: Error - Total Inválido

```json
POST /api/facturas
Content-Type: application/json

{
  "id_cita": 1,
  "total": 0,
  "metodo_pago": "efectivo"
}
```

**Resultado esperado:**
- Status: 400 Bad Request
- Body: `{ "message": "El total debe ser mayor a 0" }`

## Solución de Problemas

### Problema: "Property 'id_cita' not found"

**Causa:** El nombre de la propiedad en el modelo no coincide con el JSON del frontend.

**Solución:** Verifica que el modelo use nombres en minúsculas con guiones bajos:
- ✅ `id_cita` (correcto)
- ❌ `IdCita` (incorrecto)
- ❌ `Id_Cita` (incorrecto)

### Problema: "Cannot insert NULL into column 'fecha_emision'"

**Causa:** La base de datos requiere `fecha_emision` pero no se está generando en el backend.

**Solución:** El controlador actualizado ya genera `fecha_emision` automáticamente si no se proporciona.

### Problema: "Foreign key constraint failed"

**Causa:** El `id_cita` no existe en la tabla de citas.

**Solución:** Verifica que la cita exista antes de crear la factura, o agrega validación en el controlador:

```csharp
// Verificar que la cita existe
var citaExists = await _context.citas.AnyAsync(c => c.id_cita == facturas.id_cita);
if (!citaExists)
{
    return BadRequest(new { message = $"La cita con ID {facturas.id_cita} no existe" });
}
```

## Checklist de Verificación

Antes de considerar que el modelo está correcto:

- [ ] El modelo tiene la propiedad `id_factura` como clave primaria auto-incremental
- [ ] El modelo tiene la propiedad `id_cita` como `int` requerido
- [ ] El modelo tiene la propiedad `total` como `decimal` o `double` requerido
- [ ] El modelo tiene la propiedad `metodo_pago` como `string` requerido
- [ ] El modelo tiene la propiedad `fecha_emision` como `DateTime` requerido
- [ ] Los nombres de las propiedades coinciden EXACTAMENTE con el JSON del frontend
- [ ] El `contextDB` tiene `DbSet<facturas> facturas { get; set; }`
- [ ] La base de datos tiene la tabla `facturas` con las columnas correctas
- [ ] El controlador valida los campos requeridos
- [ ] El controlador genera `fecha_emision` si no se proporciona

## Contacto

Si después de verificar el modelo el problema persiste, comparte:
- El código completo del modelo `facturas`
- La configuración de `contextDB` relacionada con `facturas`
- El esquema de la tabla `facturas` en la base de datos
- Los logs de error del servidor al intentar crear una factura

