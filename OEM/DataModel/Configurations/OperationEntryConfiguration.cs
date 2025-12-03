using Microsoft.EntityFrameworkCore;

namespace DataModel.Configurations;

using System.Globalization;
using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


public class OperationEntryConfiguration : IEntityTypeConfiguration<OperationEntryDataModel>
{
    public void Configure(EntityTypeBuilder<OperationEntryDataModel> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.VesselName)
            .IsRequired();

        builder.Property(e => e.ArrivalTime)
            .IsRequired();

        builder.Property(e => e.DepartureTime)
            .IsRequired();


        builder.Property(e => e.Cranes)
            .IsRequired();

        builder.Property(e => e.StaffMembers)
            .IsRequired();

        builder.Property(e => e.LastModifiedAt)
            .IsRequired();

    }
}

         