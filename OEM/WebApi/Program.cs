using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

using Application.Services;
using DataModel.Repository;
using Domain.IRepository;
using DataModel.Mapper;
using Domain.Factory;



var builder = WebApplication.CreateBuilder(args);

// ----------------------
//     Basic Services
// ----------------------
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });



builder.Services.AddDbContext<OEMContext>(opt =>
    opt.UseInMemoryDatabase("OEMDatabase")
    //opt.UseSqlite("Data Source=OEMDatabase.sqlite")
    //opt.UseSqlite(Host.CreateApplicationBuilder().Configuration.GetConnectionString("OEMDatabase"))
    );

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200",
            "http://141.253.198.138"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .WithExposedHeaders("Authorization");
    });
});

builder.Services.AddTransient<IIncidentTypeRepository, IncidentTypeRepository>();
builder.Services.AddTransient<IIncidentTypeFactory, IncidentTypeFactory>();
builder.Services.AddTransient<IncidentTypeMapper>();
builder.Services.AddTransient<IncidentTypeService>();

var app = builder.Build();

// ----------------------
//     Swagger UI
// ----------------------
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowSpecificOrigin");

// Seed inicial da base de dados
// WebApi.Helpers.Utilities.InitializeDatabase(app); // Comentado para evitar conflitos nos testes

// ----------------------
//     Routing
// ----------------------
app.MapControllers();

app.Run();

public partial class Program { }
