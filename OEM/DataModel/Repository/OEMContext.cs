namespace DataModel.Repository;


using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Configuration;

public class OEMContext : DbContext
{
    protected readonly IConfiguration? Configuration;

    public OEMContext(DbContextOptions<OEMContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        
    }

}