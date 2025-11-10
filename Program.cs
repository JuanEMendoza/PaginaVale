using ApiPeluqueria.context;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors;

namespace ApiPeluqueria
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Add the database
            builder.Services.AddDbContext<contextDB>(options =>
                options.UseMySql(
                    builder.Configuration.GetConnectionString("Connection_mysql"),
                    ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("Connection_mysql"))));

            // ==========================================================
            // ✅ CONFIGURACIÓN DE CORS PARA FRONTEND EN RENDER
            // ==========================================================
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowRenderFrontend", policy =>
                {
                    policy.WithOrigins(
                            "https://paginavale.onrender.com",  // Frontend en Render (PRODUCCIÓN)
                            "http://localhost:5500",            // Desarrollo local
                            "http://127.0.0.1:5500",            // Desarrollo local alternativa
                            "http://localhost:3000",            // Otro puerto
                            "http://localhost:8080",            // Otro puerto
                            "http://localhost:5000",            // Otro puerto común
                            "https://localhost:5500"            // HTTPS local
                          )
                          .AllowAnyMethod()                     // Permite GET, POST, PUT, DELETE, OPTIONS, PATCH, etc.
                          .AllowAnyHeader()                     // Permite cualquier header (Content-Type, Authorization, etc.)
                          .AllowCredentials();                  // Permite cookies y credenciales
                });
            });

            // Habilitar el caché de respuestas
            builder.Services.AddResponseCaching();

            var app = builder.Build();

            // Configure the HTTP request pipeline
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API v1");
                    c.RoutePrefix = "swagger";
                });
            }

            // ==========================================================
            // ✅ ORDEN CRÍTICO DE MIDDLEWARES PARA CORS
            // ==========================================================
            // 1. CORS debe ser el PRIMER middleware después de UseSwagger/UseSwaggerUI
            // 2. UseRouting debe ir después de CORS
            // 3. UseAuthorization debe ir después de UseRouting
            // ==========================================================

            // Redirección HTTPS (comentado para evitar problemas, descomentar si es necesario)
            // app.UseHttpsRedirection();

            // ✅ CORS - DEBE IR PRIMERO (antes de Routing y Authorization)
            app.UseCors("AllowRenderFrontend");

            // Habilitar caché
            app.UseResponseCaching();

            // Routing
            app.UseRouting();

            // Authorization (si lo necesitas)
            app.UseAuthorization();

            // Mapeo de controladores
            app.MapControllers();

            app.Run();
        }
    }
}

