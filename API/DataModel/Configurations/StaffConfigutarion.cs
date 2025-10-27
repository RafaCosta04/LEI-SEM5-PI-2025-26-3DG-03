using Microsoft.EntityFrameworkCore;

namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class StaffConfiguration : IEntityTypeConfiguration<StaffDataModel>
{

    public void Configure(EntityTypeBuilder<StaffDataModel> builder)
    {
        builder.HasKey(s => s.Id);

        builder.HasIndex(s => s.Email)
            .IsUnique();

        builder.HasIndex(s => s.Phone)
            .IsUnique();

        builder.HasMany<QualificationDataModel>(s => s.Qualification)
            .WithMany().UsingEntity(j => j.ToTable("StaffQualification"));

        builder.OwnsOne(s => s.OperationalWindow, ow =>
            {
                ow.Property(o => o.StartDay).HasColumnName("OperationalWindow_StartDay").IsRequired();
                ow.Property(o => o.EndDay).HasColumnName("OperationalWindow_EndDay").IsRequired();
                ow.Property(o => o.StartTime).HasColumnName("OperationalWindow_StartTime").IsRequired();
                ow.Property(o => o.EndTime).HasColumnName("OperationalWindow_EndTime").IsRequired();
            });
    }

}