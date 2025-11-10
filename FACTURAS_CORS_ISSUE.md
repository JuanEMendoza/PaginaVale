# 🚨 Problema: No se pueden crear facturas - Error de CORS

## Problema Actual

El módulo de facturas no puede crear facturas nuevas debido a un error de CORS (Cross-Origin Resource Sharing).

### Error en la consola:

```
Access to fetch at 'https://apipeluqueria-1.onrender.com/api/facturas' 
from origin 'https://paginavale.onrender.com' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Diagnóstico

✅ **Frontend correcto**: El código en `admin-script.js` está correctamente implementado
- La función `handleSaveFactura` hace la petición POST correctamente
- Los headers están configurados: `Content-Type: application/json`
- El cuerpo de la petición está correctamente formateado

❌ **Backend sin CORS**: La API en `https://apipeluqueria-1.onrender.com` NO está configurada para permitir peticiones POST desde `https://paginavale.onrender.com`

## Solución

**IMPORTANTE**: Este problema DEBE solucionarse en el BACKEND de la API, no en el frontend.

### Pasos para solucionar:

1. **Abre el proyecto de la API** (backend en .NET)

2. **Encuentra el archivo `Program.cs`** (o `Startup.cs` si usas .NET 5 o anterior)

3. **Agrega la configuración de CORS** para permitir peticiones desde tu frontend:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
// ... tus otros servicios ...

// ⬇️ AGREGAR ESTO - Configuración de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowRenderFrontend", policy =>
    {
        policy.WithOrigins(
                "https://paginavale.onrender.com",  // Tu frontend en producción
                "http://localhost:5500",            // Para desarrollo local
                "http://127.0.0.1:5500",            // Para desarrollo local
                "http://localhost:3000",            // Si usas otro puerto
                "http://localhost:8080"             // Si usas otro puerto
              )
              .AllowAnyMethod()                     // Permite GET, POST, PUT, DELETE, etc.
              .AllowAnyHeader()                     // Permite cualquier header
              .AllowCredentials();                  // Si usas cookies/autenticación
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ⬇️ IMPORTANTE: UseCors debe ir ANTES de UseAuthentication y UseAuthorization
app.UseCors("AllowRenderFrontend");

// Si tienes autenticación, debe ir DESPUÉS de UseCors
// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

app.Run();
```

4. **Guarda los cambios** y compila el proyecto

5. **Redespliega la API** a Render

6. **Espera** a que Render termine el despliegue (puede tardar unos minutos)

7. **Prueba** crear una factura desde el panel administrativo

## Verificación

Después de aplicar los cambios, verifica que:

1. ✅ La API responde a peticiones OPTIONS (preflight) con headers CORS correctos
2. ✅ La API responde a peticiones POST con headers CORS correctos
3. ✅ Los headers de respuesta incluyen:
   - `Access-Control-Allow-Origin: https://paginavale.onrender.com`
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type`

### Usar test-cors.html para verificar:

1. Abre `test-cors.html` en tu navegador
2. Haz clic en "Test POST /api/facturas"
3. Revisa los resultados:
   - ✅ Debe mostrar los headers CORS en la respuesta
   - ❌ Si muestra error de CORS, la configuración del backend no está aplicada

## Por qué funciona GET pero no POST

- Las peticiones GET son "simples" y algunos servidores las permiten por defecto
- Las peticiones POST requieren una respuesta preflight (OPTIONS) que el backend debe manejar explícitamente
- El backend DEBE configurar CORS explícitamente para permitir POST, PUT, DELETE, etc.

## Notas Adicionales

- El orden de los middlewares ES IMPORTANTE: `app.UseCors()` debe ir ANTES de `app.UseAuthentication()` y `app.UseAuthorization()`
- Si usas `AllowAnyOrigin()`, NO puedes usar `AllowCredentials()` al mismo tiempo
- Para producción, es recomendable especificar orígenes exactos en lugar de `AllowAnyOrigin()`

## Archivos Relacionados

- `BACKEND_CORS_FIX.md` - Documentación completa sobre CORS
- `test-cors.html` - Herramienta para diagnosticar problemas de CORS
- `admin-script.js` (línea 1318-1475) - Función `handleSaveFactura` que hace la petición

## Contacto

Si después de seguir estos pasos el problema persiste:

1. Verifica que el código de CORS esté correctamente agregado en el backend
2. Verifica que `app.UseCors()` esté antes de otros middlewares
3. Verifica que el origen en `WithOrigins()` sea exactamente `https://paginavale.onrender.com` (sin barra al final)
4. Verifica que hayas redesplegado la API
5. Limpia la caché del navegador (Ctrl+Shift+Delete)
6. Prueba en modo incógnito
7. Revisa los logs de Render para ver si hay errores

