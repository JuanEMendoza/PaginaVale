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
    [EnableCors("AllowRenderFrontend")]
    public class usuariosController : ControllerBase
    {
        private readonly contextDB _context;

        public usuariosController(contextDB context)
        {
            _context = context;
        }

        // GET: api/usuarios
        [HttpGet]
        public async Task<ActionResult<IEnumerable<usuarios>>> Getusuarios()
        {
            return await _context.usuarios.ToListAsync();
        }

        // GET: api/usuarios/5
        [HttpGet("{id}")]
        public async Task<ActionResult<usuarios>> Getusuarios(int id)
        {
            var usuarios = await _context.usuarios.FindAsync(id);

            if (usuarios == null)
            {
                return NotFound();
            }

            return usuarios;
        }

        // PUT: api/usuarios/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> Putusuarios(int id, [FromBody] usuarios usuarios)
        {
            // Validar que el objeto no sea nulo
            if (usuarios == null)
            {
                return BadRequest(new { message = "Los datos del usuario no pueden ser nulos" });
            }

            // Validar que el ID de la URL coincida con el ID del cuerpo
            if (id != usuarios.id_usuario)
            {
                return BadRequest(new { message = "El ID de la URL no coincide con el ID del usuario" });
            }

            // Validar campos requeridos
            if (string.IsNullOrWhiteSpace(usuarios.nombre))
            {
                return BadRequest(new { message = "El nombre es requerido" });
            }

            if (string.IsNullOrWhiteSpace(usuarios.correo))
            {
                return BadRequest(new { message = "El correo electrónico es requerido" });
            }

            if (string.IsNullOrWhiteSpace(usuarios.rol))
            {
                return BadRequest(new { message = "El rol es requerido" });
            }

            if (string.IsNullOrWhiteSpace(usuarios.estado))
            {
                return BadRequest(new { message = "El estado es requerido" });
            }

            // Validar que el rol sea válido
            var rolesValidos = new[] { "administrador", "trabajador", "cliente" };
            if (!rolesValidos.Contains(usuarios.rol.ToLower()))
            {
                return BadRequest(new { message = $"El rol debe ser uno de: {string.Join(", ", rolesValidos)}" });
            }

            // Validar que el estado sea válido
            var estadosValidos = new[] { "activo", "inactivo" };
            if (!estadosValidos.Contains(usuarios.estado.ToLower()))
            {
                return BadRequest(new { message = $"El estado debe ser uno de: {string.Join(", ", estadosValidos)}" });
            }

            // Verificar que el usuario existe
            var usuarioExistente = await _context.usuarios.FindAsync(id);
            if (usuarioExistente == null)
            {
                return NotFound(new { message = $"El usuario con ID {id} no existe" });
            }

            // Actualizar los campos del usuario existente
            usuarioExistente.nombre = usuarios.nombre;
            usuarioExistente.correo = usuarios.correo;
            usuarioExistente.telefono = usuarios.telefono;
            usuarioExistente.rol = usuarios.rol;
            usuarioExistente.estado = usuarios.estado;

            // Solo actualizar la contraseña si se proporciona (no está vacía o nula)
            if (!string.IsNullOrWhiteSpace(usuarios.contrasena))
            {
                usuarioExistente.contrasena = usuarios.contrasena;
            }

            // No actualizar fecha_registro (se mantiene la original)

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!usuariosExists(id))
                {
                    return NotFound(new { message = $"El usuario con ID {id} ya no existe" });
                }
                else
                {
                    throw;
                }
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Error al actualizar el usuario en la base de datos", error = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error inesperado al actualizar el usuario", error = ex.Message });
            }

            // Devolver el usuario actualizado con código 200 (OK)
            return Ok(usuarioExistente);
        }

        // POST: api/usuarios
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<usuarios>> Postusuarios([FromBody] usuarios usuarios)
        {
            // Validar que el objeto no sea nulo
            if (usuarios == null)
            {
                return BadRequest(new { message = "Los datos del usuario no pueden ser nulos" });
            }

            // Validar campos requeridos
            if (string.IsNullOrWhiteSpace(usuarios.nombre))
            {
                return BadRequest(new { message = "El nombre es requerido" });
            }

            if (string.IsNullOrWhiteSpace(usuarios.correo))
            {
                return BadRequest(new { message = "El correo electrónico es requerido" });
            }

            if (string.IsNullOrWhiteSpace(usuarios.contrasena))
            {
                return BadRequest(new { message = "La contraseña es requerida para nuevos usuarios" });
            }

            if (string.IsNullOrWhiteSpace(usuarios.rol))
            {
                return BadRequest(new { message = "El rol es requerido" });
            }

            if (string.IsNullOrWhiteSpace(usuarios.estado))
            {
                return BadRequest(new { message = "El estado es requerido" });
            }

            // Validar que el rol sea válido
            var rolesValidos = new[] { "administrador", "trabajador", "cliente" };
            if (!rolesValidos.Contains(usuarios.rol.ToLower()))
            {
                return BadRequest(new { message = $"El rol debe ser uno de: {string.Join(", ", rolesValidos)}" });
            }

            // Validar que el estado sea válido
            var estadosValidos = new[] { "activo", "inactivo" };
            if (!estadosValidos.Contains(usuarios.estado.ToLower()))
            {
                return BadRequest(new { message = $"El estado debe ser uno de: {string.Join(", ", estadosValidos)}" });
            }

            // Si no se proporciona fecha_registro, usar la fecha actual
            if (usuarios.fecha_registro == default(DateTime) || usuarios.fecha_registro == DateTime.MinValue)
            {
                usuarios.fecha_registro = DateTime.UtcNow;
            }

            try
            {
                _context.usuarios.Add(usuarios);
                await _context.SaveChangesAsync();

                return CreatedAtAction("Getusuarios", new { id = usuarios.id_usuario }, usuarios);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Error al crear el usuario en la base de datos", error = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error inesperado al crear el usuario", error = ex.Message });
            }
        }

        // DELETE: api/usuarios/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deleteusuarios(int id)
        {
            var usuarios = await _context.usuarios.FindAsync(id);
            if (usuarios == null)
            {
                return NotFound(new { message = $"El usuario con ID {id} no existe" });
            }

            try
            {
                _context.usuarios.Remove(usuarios);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Error al eliminar el usuario de la base de datos", error = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error inesperado al eliminar el usuario", error = ex.Message });
            }
        }

        private bool usuariosExists(int id)
        {
            return _context.usuarios.Any(e => e.id_usuario == id);
        }
    }
}

