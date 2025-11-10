# Solución al Problema de CORS

## Problema

El error que estás viendo:
```
Access to fetch at 'https://apipeluqueria-1.onrender.com/api/citas' from origin 'https://paginavale.onrender.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Esto significa que el **backend de la API** no está configurado para permitir peticiones desde el origen de tu página web (`https://paginavale.onrender.com`).

## Solución

**IMPORTANTE:** Este problema debe solucionarse en el **backend de la API**, no en el frontend.

### Para API en .NET (ASP.NET Core)

En tu proyecto de la API, necesitas configurar CORS. Aquí están las opciones:

#### Opción 1: Permitir todos los orígenes (solo para desarrollo)

En `Program.cs` o `Startup.cs`:

```csharp
// Permitir cualquier origen (NO RECOMENDADO para producción)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Usar la política
app.UseCors("AllowAll");
```

#### Opción 2: Permitir orígenes específicos (RECOMENDADO)

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        policy.WithOrigins("https://paginavale.onrender.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Si usas cookies/autenticación
    });
});

app.UseCors("AllowSpecificOrigins");
```

#### Opción 3: Permitir múltiples orígenes

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMultipleOrigins", policy =>
    {
        policy.WithOrigins(
                "https://paginavale.onrender.com",
                "http://localhost:5500",  // Para desarrollo local
                "http://127.0.0.1:5500"   // Para desarrollo local
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

app.UseCors("AllowMultipleOrigins");
```

### Ubicación del código

El código de CORS debe estar en:
- `Program.cs` (si usas .NET 6+)
- `Startup.cs` (si usas .NET 5 o anterior)

**IMPORTANTE:** `app.UseCors()` debe estar **ANTES** de `app.UseAuthentication()` y `app.UseAuthorization()` si las tienes.

### Ejemplo completo de Program.cs

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
// ... otros servicios

// Configurar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowRender", policy =>
    {
        policy.WithOrigins("https://paginavale.onrender.com")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// IMPORTANTE: UseCors debe ir antes de UseAuthentication y UseAuthorization
app.UseCors("AllowRender");

// ... otros middlewares
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
```

## Verificación

Después de aplicar los cambios:

1. **Despliega la API actualizada** a Render
2. **Verifica en el navegador** (F12 > Network):
   - Las peticiones deben tener status 200 (o el código esperado)
   - En los headers de respuesta debe aparecer: `Access-Control-Allow-Origin: https://paginavale.onrender.com`

## Nota sobre CSP (Content Security Policy)

El error de CSP que también mencionaste es menos crítico. Ya hemos eliminado los `onclick` inline del HTML para evitar este problema. Si Render sigue bloqueando, puedes agregar un meta tag en el HTML (aunque Render puede ignorarlo):

```html
<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval';">
```

Sin embargo, **NO es recomendable** usar `unsafe-eval` en producción por razones de seguridad.

## Resumen

1. ✅ **Frontend corregido**: Eliminados los `onclick` inline, usando event delegation
2. ⚠️ **Backend requiere acción**: Configurar CORS en la API para permitir `https://paginavale.onrender.com`
3. 🔄 **Después de configurar CORS**: Redesplegar la API y probar nuevamente

