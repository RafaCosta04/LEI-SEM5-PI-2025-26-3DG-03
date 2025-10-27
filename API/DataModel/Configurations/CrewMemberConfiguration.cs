namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class CrewMemberConfiguration : IEntityTypeConfiguration<CrewMemberDataModel>
{
    public void Configure(EntityTypeBuilder<CrewMemberDataModel> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.CitizenId)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(c => c.Nationality)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(c => c.Rank)
            .HasMaxLength(50)
            .IsRequired();

    }
}
