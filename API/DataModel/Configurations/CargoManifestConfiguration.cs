namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class CargoManifestConfiguration : IEntityTypeConfiguration<CargoManifestDataModel>
{
    public void Configure(EntityTypeBuilder<CargoManifestDataModel> builder)
    {
        builder.HasKey(cm => cm.Id);

        builder.HasMany(cm => cm.Entries)
            .WithOne(e => e.CargoManifest)
            .HasForeignKey(e => e.CargoManifestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cm => cm.VesselVisitNotification)
            .WithMany(v => v.CargoManifests)
            .HasForeignKey(cm => cm.VesselVisitNotificationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}