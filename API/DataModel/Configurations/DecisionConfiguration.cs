namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
public class DecisionConfiguration : IEntityTypeConfiguration<DecisionDataModel>
{
    public void Configure(EntityTypeBuilder<DecisionDataModel> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.OfficerId)
            .IsRequired();

        builder.Property(d => d.DecisionDate)
            .IsRequired();

        builder.Property(d => d.Status)
            .IsRequired();

        builder.Property(d => d.ResponseMessage)
            .IsRequired();

        builder.HasOne(d => d.VesselVisitNotification)
            .WithMany()
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("Decision");
    }
}