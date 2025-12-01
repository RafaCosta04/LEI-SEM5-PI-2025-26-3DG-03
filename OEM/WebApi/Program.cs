using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using DataModel.Repository;



var builder = WebApplication.CreateBuilder(args);

// ----------------------
//     Basic Services
// ----------------------
builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));



builder.Services.AddDbContext<OEMContext>(opt =>
    opt.UseInMemoryDatabase("OEMDatabase")
    //opt.UseSqlite("Data Source=OEMDatabase.sqlite")
    //opt.UseSqlite(Host.CreateApplicationBuilder().Configuration.GetConnectionString("OEMDatabase"))
    );

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ----------------------
//     Swagger UI
// ----------------------
app.UseSwagger();
app.UseSwaggerUI();

// ----------------------
//     Routing
// ----------------------
app.MapControllers();

app.Run();

public partial class Program { }
