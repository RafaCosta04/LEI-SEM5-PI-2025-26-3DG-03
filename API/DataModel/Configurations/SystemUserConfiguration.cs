namespace DataModel.Configurations;
using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class SystemUserConfiguration : IEntityTypeConfiguration<SystemUserDataModel>
{
    public void Configure(EntityTypeBuilder<SystemUserDataModel> builder)
    {
        builder.HasKey(su => su.Id);

        builder.HasIndex(su => su.Username)
            .IsUnique();
        
        builder.HasIndex(su => su.Email)
            .IsUnique();

        builder.Property(su => su.Role)
            .IsRequired();
    }
}