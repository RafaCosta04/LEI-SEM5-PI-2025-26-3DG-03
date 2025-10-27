namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class CargoManifestEntryConfiguration : IEntityTypeConfiguration<CargoManifestEntryDataModel>
{
    public void Configure(EntityTypeBuilder<CargoManifestEntryDataModel> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Container)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Row).IsRequired();
        builder.Property(e => e.Bay).IsRequired();
        builder.Property(e => e.Tier).IsRequired();

        builder.HasOne(e => e.CargoManifest)
            .WithMany(cm => cm.Entries)
            .HasForeignKey(e => e.CargoManifestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.StorageArea)
            .WithMany()
            .HasForeignKey(e => e.StorageAreaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
