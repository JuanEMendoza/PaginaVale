using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors;
using ApiPeluqueria.Models;
using ApiPeluqueria.context;

namespace ApiPeluqueria.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableCors("AllowRenderFrontend")]  // ✅ AGREGADO: CORS explícito para este controlador
    public class facturasController : ControllerBase
    {
        private readonly contextDB _context;

        public facturasController(contextDB context)
        {
            _context = context;
        }

        // GET: api/facturas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<facturas>>> Getfacturas()
        {
            return await _context.facturas.ToListAsync();
        }

        // GET: api/facturas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<facturas>> Getfacturas(int id)
        {
            var facturas = await _context.facturas.FindAsync(id);

            if (facturas == null)
            {
                return NotFound();
            }

            return facturas;
        }

        // PUT: api/facturas/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> Putfacturas(int id, [FromBody] facturas facturas)
        {
            // Validar que el objeto no sea nulo
            if (facturas == null)
            {
                return BadRequest(new { message = "Los datos de la factura no pueden ser nulos" });
            }

            // Validar que el ID de la URL coincida con el ID del cuerpo
            if (id != facturas.id_factura)
            {
                return BadRequest(new { message = "El ID de la URL no coincide con el ID de la factura" });
            }

            // Validar campos requeridos
            if (facturas.id_cita <= 0)
            {
                return BadRequest(new { message = "El ID de la cita es requerido y debe ser mayor a 0" });
            }

            if (facturas.total <= 0)
            {
                return BadRequest(new { message = "El total debe ser mayor a 0" });
            }

            if (string.IsNullOrWhiteSpace(facturas.metodo_pago))
            {
                return BadRequest(new { message = "El método de pago es requerido" });
            }

            // Validar que la fecha_emision sea válida
            if (facturas.fecha_emision == default(DateTime) || facturas.fecha_emision == DateTime.MinValue)
            {
                return BadRequest(new { message = "La fecha de emisión es requerida y debe ser válida" });
            }

            // Asegurar que la fecha esté en UTC si viene del frontend
            // El frontend envía fechas en formato ISO 8601 UTC (ej: "2025-11-10T16:33:25.945Z")
            if (facturas.fecha_emision.Kind != DateTimeKind.Utc)
            {
                facturas.fecha_emision = facturas.fecha_emision.ToUniversalTime();
            }

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

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!facturasExists(id))
                {
                    return NotFound(new { message = $"La factura con ID {id} ya no existe" });
                }
                else
                {
                    throw;
                }
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Error al actualizar la factura en la base de datos", error = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error inesperado al actualizar la factura", error = ex.Message });
            }

            // La factura existente ya tiene los valores actualizados
            // Si necesitas valores calculados o triggers de la BD, puedes recargarla:
            // await _context.Entry(facturaExistente).ReloadAsync();
            
            // Devolver la factura actualizada con código 200 (OK)
            return Ok(facturaExistente);
        }

        // POST: api/facturas
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<facturas>> Postfacturas([FromBody] facturas facturas)
        {
            // Validar que el objeto no sea nulo
            if (facturas == null)
            {
                return BadRequest(new { message = "Los datos de la factura no pueden ser nulos" });
            }

            // Validar campos requeridos
            if (facturas.id_cita <= 0)
            {
                return BadRequest(new { message = "El ID de la cita es requerido y debe ser mayor a 0" });
            }

            if (facturas.total <= 0)
            {
                return BadRequest(new { message = "El total debe ser mayor a 0" });
            }

            if (string.IsNullOrWhiteSpace(facturas.metodo_pago))
            {
                return BadRequest(new { message = "El método de pago es requerido" });
            }

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

            try
            {
                _context.facturas.Add(facturas);
                await _context.SaveChangesAsync();

                // Devolver la factura creada con el ID generado
                return CreatedAtAction(nameof(Getfacturas), new { id = facturas.id_factura }, facturas);
            }
            catch (DbUpdateException ex)
            {
                // Log del error (puedes agregar logging aquí)
                return StatusCode(500, new { message = "Error al guardar la factura en la base de datos", error = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                // Log del error (puedes agregar logging aquí)
                return StatusCode(500, new { message = "Error inesperado al crear la factura", error = ex.Message });
            }
        }

        // DELETE: api/facturas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deletefacturas(int id)
        {
            var facturas = await _context.facturas.FindAsync(id);
            if (facturas == null)
            {
                return NotFound();
            }

            try
            {
                _context.facturas.Remove(facturas);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Error al eliminar la factura de la base de datos", error = ex.InnerException?.Message ?? ex.Message });
            }
        }

        private bool facturasExists(int id)
        {
            return _context.facturas.Any(e => e.id_factura == id);
        }
    }
}

