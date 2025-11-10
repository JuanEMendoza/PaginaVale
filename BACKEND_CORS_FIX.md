# 🔧 SOLUCIÓN CORS - Código para el Backend

## ⚠️ PROBLEMA ACTUAL

Tu API en `https://apipeluqueria-1.onrender.com` **NO está permitiendo peticiones** desde `https://paginavale.onrender.com` debido a la política CORS.

## ✅ SOLUCIÓN RÁPIDA

### Paso 1: Abre tu proyecto de la API (.NET)

### Paso 2: Encuentra el archivo `Program.cs` (o `Startup.cs` si usas .NET 5 o anterior)

### Paso 3: Agrega este código

#### Para .NET 6, 7, 8 (Program.cs):

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
// ... tus otros servicios aquí ...

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

// ⬇️ IMPORTANTE: UseCors debe ir ANTES de UseAuthentication y UseAuthorization
app.UseCors("AllowRenderFrontend");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Si tienes autenticación, debe ir DESPUÉS de UseCors
// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

app.Run();
```

#### Para .NET 5 o anterior (Startup.cs):

```csharp
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddControllers();
        // ... tus otros servicios ...

        // ⬇️ AGREGAR ESTO - Configuración de CORS
        services.AddCors(options =>
        {
            options.AddPolicy("AllowRenderFrontend", policy =>
            {
                policy.WithOrigins(
                        "https://paginavale.onrender.com",
                        "http://localhost:5500",
                        "http://127.0.0.1:5500"
                      )
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        });
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();

        // ⬇️ IMPORTANTE: UseCors debe ir ANTES de UseAuthentication y UseAuthorization
        app.UseCors("AllowRenderFrontend");

        app.UseRouting();

        // Si tienes autenticación, debe ir DESPUÉS de UseCors
        // app.UseAuthentication();
        // app.UseAuthorization();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
    }
}
```

### Paso 4: Si quieres permitir TODOS los orígenes (solo para pruebas):

⚠️ **NO RECOMENDADO para producción**, pero útil para debugging:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

app.UseCors("AllowAll");
```

**Nota:** Si usas `AllowAnyOrigin()`, NO puedes usar `AllowCredentials()` al mismo tiempo.

## 🔍 VERIFICACIÓN

### Opción 1: Usar el archivo de prueba

1. Abre `test-cors.html` en tu navegador
2. Haz click en "Test Todos los Endpoints"
3. Revisa los resultados

### Opción 2: Verificar manualmente

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta hacer una petición desde tu página web
4. Revisa los headers de respuesta:
   - Debe aparecer: `Access-Control-Allow-Origin: https://paginavale.onrender.com`
   - Debe aparecer: `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, ...`
   - Debe aparecer: `Access-Control-Allow-Headers: Content-Type, ...`

### Opción 3: Usar curl (desde terminal)

```bash
curl -I -X OPTIONS https://apipeluqueria-1.onrender.com/api/citas \
  -H "Origin: https://paginavale.onrender.com" \
  -H "Access-Control-Request-Method: POST"
```

Deberías ver headers como:
```
Access-Control-Allow-Origin: https://paginavale.onrender.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type
```

## 🚀 DESPLIEGUE

1. **Guarda los cambios** en `Program.cs` o `Startup.cs`
2. **Compila el proyecto** para verificar que no hay errores
3. **Redespliega la API** a Render
4. **Espera** a que Render termine el despliegue (puede tardar unos minutos)
5. **Prueba** desde tu página web

## 📝 EJEMPLO COMPLETO DE Program.cs

```csharp
using Microsoft.AspNetCore.Cors;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ⬇️ CONFIGURACIÓN DE CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowRenderFrontend", policy =>
    {
        policy.WithOrigins("https://paginavale.onrender.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
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

// ⬇️ IMPORTANTE: UseCors ANTES de otros middlewares
app.UseCors("AllowRenderFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
```

## ❓ PREGUNTAS FRECUENTES

### ¿Por qué necesito CORS?

CORS es una política de seguridad del navegador que previene que sitios web hagan peticiones a otros dominios sin permiso explícito.

### ¿Por qué funciona GET pero no POST?

Algunos servidores permiten GET por defecto pero bloquean POST, PUT, DELETE. Necesitas configurar CORS explícitamente.

### ¿Puedo permitir todos los orígenes?

Sí, pero **NO es recomendado para producción** por razones de seguridad. Úsalo solo para desarrollo.

### ¿El orden de los middlewares importa?

**SÍ**, `app.UseCors()` debe ir **ANTES** de `app.UseAuthentication()` y `app.UseAuthorization()`.

## 🆘 SI SIGUE SIN FUNCIONAR

1. Verifica que el código de CORS esté correctamente agregado
2. Verifica que `app.UseCors()` esté antes de otros middlewares
3. Verifica que el origen en `WithOrigins()` sea exactamente `https://paginavale.onrender.com` (sin barra al final)
4. Verifica que hayas redesplegado la API
5. Limpia la caché del navegador (Ctrl+Shift+Delete)
6. Prueba en modo incógnito
7. Revisa los logs de Render para ver si hay errores

## 📞 CONTACTO

Si después de seguir estos pasos el problema persiste, comparte:
- El código completo de tu `Program.cs` o `Startup.cs`
- Los logs de error de Render
- El resultado de `test-cors.html`

