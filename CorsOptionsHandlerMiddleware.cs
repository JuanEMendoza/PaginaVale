using Microsoft.AspNetCore.Http;

namespace ApiPeluqueria
{
    /// <summary>
    /// Middleware personalizado para manejar explícitamente las peticiones OPTIONS (preflight CORS)
    /// </summary>
    public class CorsOptionsHandlerMiddleware
    {
        private readonly RequestDelegate _next;

        public CorsOptionsHandlerMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Manejar peticiones OPTIONS (preflight) explícitamente
            if (context.Request.Method == "OPTIONS")
            {
                context.Response.StatusCode = 204; // No Content
                await context.Response.WriteAsync(string.Empty);
                return;
            }

            await _next(context);
        }
    }
}

