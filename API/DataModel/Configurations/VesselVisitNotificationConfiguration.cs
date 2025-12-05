namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


public class VesselVisitNotificationConfiguration : IEntityTypeConfiguration<VesselVisitNotificationDataModel>
{
    public void Configure(EntityTypeBuilder<VesselVisitNotificationDataModel> builder)
    {
        builder.HasKey(vvn => vvn.Id);

        builder.HasIndex(vvn => vvn.Code)
            .IsUnique();

        builder.Property(vvn => vvn.ETA)
            .IsRequired();

        builder.Property(vvn => vvn.ETD)
            .IsRequired();

        builder.Property(vvn => vvn.VisitStatus)
            .IsRequired();

        builder.HasOne(vvn => vvn.Vessel)
            .WithMany()
            .HasForeignKey(vvn => vvn.VesselId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(vvn => vvn.Representative)
            .WithMany()
            .HasForeignKey(vvn => vvn.RepresentativeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(vvn => vvn.CargoManifests)
            .WithOne(cm => cm.VesselVisitNotification)
            .HasForeignKey(cm => cm.VesselVisitNotificationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(vvn => vvn.CrewMembers)
        .WithOne()
        .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.AssignedDock)
            .WithMany()
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(vvn => vvn.DockReassignmentLogs)
            .WithOne(drl => drl.VesselVisitNotification)
            .HasForeignKey(drl => drl.VesselVisitNotificationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("VesselVisitNotification");
    }
}
