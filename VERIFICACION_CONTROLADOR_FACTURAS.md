# 🔍 Verificación del Controlador de Facturas

## Problema

Si después de configurar CORS en `Program.cs` aún tienes errores al crear facturas, el problema podría estar en el **controlador de Facturas**.

## Verificación del Controlador

### 1. Verifica que el controlador NO tenga `[DisableCors]`

Busca tu controlador de Facturas (probablemente `FacturasController.cs` o `FacturaController.cs`) y verifica que **NO** tenga este atributo:

```csharp
[DisableCors]  // ❌ ESTO BLOQUEA CORS
[ApiController]
[Route("api/[controller]")]
public class FacturasController : ControllerBase
{
    // ...
}
```

### 2. Verifica que el controlador permita CORS

El controlador debería verse así:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;

namespace ApiPeluqueria.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors("AllowRenderFrontend")]  // ✅ OPCIONAL: Puedes agregar esto explícitamente
    public class FacturasController : ControllerBase
    {
        // Tu código aquí
    }
}
```

**Nota:** Si ya tienes CORS configurado globalmente en `Program.cs`, NO necesitas `[EnableCors]` en cada controlador, pero agregarlo explícitamente puede ayudar.

### 3. Verifica que los métodos POST permitan CORS

Los métodos POST deberían verse así:

```csharp
[HttpPost]
// [EnableCors("AllowRenderFrontend")]  // ✅ OPCIONAL: Puedes agregarlo aquí también
public async Task<ActionResult<Factura>> CreateFactura([FromBody] Factura factura)
{
    // Tu lógica aquí
    return Ok(factura);
}
```

### 4. Verifica que NO haya atributos que bloqueen CORS

Busca y elimina cualquiera de estos atributos si los encuentras:

```csharp
[DisableCors]                    // ❌ BLOQUEA CORS
[DisableRequestSizeLimit]        // ⚠️ Puede causar problemas
[RequestSizeLimit(...)]          // ⚠️ Puede causar problemas si es muy pequeño
```

## Ejemplo Completo de Controlador Correcto

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;
using ApiPeluqueria.context;
using Microsoft.EntityFrameworkCore;

namespace ApiPeluqueria.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors("AllowRenderFrontend")]  // ✅ Agregar explícitamente
    public class FacturasController : ControllerBase
    {
        private readonly contextDB _context;

        public FacturasController(contextDB context)
        {
            _context = context;
        }

        // GET: api/facturas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Factura>>> GetFacturas()
        {
            return await _context.Facturas.ToListAsync();
        }

        // GET: api/facturas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Factura>> GetFactura(int id)
        {
            var factura = await _context.Facturas.FindAsync(id);
            if (factura == null)
            {
                return NotFound();
            }
            return factura;
        }

        // POST: api/facturas
        [HttpPost]
        public async Task<ActionResult<Factura>> PostFactura([FromBody] Factura factura)
        {
            _context.Facturas.Add(factura);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFactura), new { id = factura.IdFactura }, factura);
        }

        // PUT: api/facturas/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFactura(int id, [FromBody] Factura factura)
        {
            if (id != factura.IdFactura)
            {
                return BadRequest();
            }

            _context.Entry(factura).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FacturaExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/facturas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFactura(int id)
        {
            var factura = await _context.Facturas.FindAsync(id);
            if (factura == null)
            {
                return NotFound();
            }

            _context.Facturas.Remove(factura);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool FacturaExists(int id)
        {
            return _context.Facturas.Any(e => e.IdFactura == id);
        }
    }
}
```

## Verificación de la Estructura de la Clase Factura

Asegúrate de que tu modelo `Factura` tenga las propiedades correctas:

```csharp
public class Factura
{
    public int IdFactura { get; set; }
    public int IdCita { get; set; }
    public decimal Total { get; set; }
    public string MetodoPago { get; set; }
    public DateTime FechaEmision { get; set; }
    
    // Relación con Cita (opcional)
    public virtual Cita Cita { get; set; }
}
```

## Pruebas

Después de verificar el controlador:

1. **Compila el proyecto** para asegurar que no hay errores
2. **Redespliega la API** a Render
3. **Prueba crear una factura** desde el frontend
4. **Revisa los logs de Render** si sigue fallando
5. **Usa `test-cors.html`** para diagnosticar el problema

## Solución de Problemas

### Si sigue sin funcionar:

1. **Agrega `[EnableCors("AllowRenderFrontend")]` explícitamente** en el controlador
2. **Verifica los logs de Render** para ver errores del servidor
3. **Prueba con Postman o curl** para verificar que el endpoint funciona
4. **Verifica que la base de datos esté accesible** y que la conexión funcione
5. **Revisa que el modelo `Factura` coincida** con lo que envía el frontend

### Comando curl para probar:

```bash
curl -X POST https://apipeluqueria-1.onrender.com/api/facturas \
  -H "Content-Type: application/json" \
  -H "Origin: https://paginavale.onrender.com" \
  -d '{
    "id_cita": 1,
    "total": 90000,
    "metodo_pago": "tarjeta_credito"
  }'
```

## Contacto

Si después de seguir estos pasos el problema persiste, comparte:
- El código completo del controlador de Facturas
- Los logs de error de Render
- El resultado de `test-cors.html`

