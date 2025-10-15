namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class VesselRecordConfiguration : IEntityTypeConfiguration<VesselRecordDataModel>
{
    public void Configure(EntityTypeBuilder<VesselRecordDataModel> builder)
    {
        builder.HasKey(v => v.Id);

        builder.HasIndex(v => v.IMONumber)
            .IsUnique();

        builder.HasIndex(v => v.VesselName);

        builder.HasOne(v => v.VesselType)
            .WithMany()
            .HasForeignKey("VesselTypeId")
            .IsRequired();

    }
}