using Microsoft.EntityFrameworkCore;

namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class VesselTypeConfiguration : IEntityTypeConfiguration<VesselTypeDataModel>
{
    public void Configure(EntityTypeBuilder<VesselTypeDataModel> builder)
    {
        builder.HasKey(v => v.Id);

        builder.HasIndex(v => v.Name)
            .IsUnique();
    }
}