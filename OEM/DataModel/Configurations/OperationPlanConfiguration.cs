using Microsoft.EntityFrameworkCore;

namespace DataModel.Configurations;

using System.Globalization;
using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


public class OperationPlanConfiguration : IEntityTypeConfiguration<OperationPlanDataModel>
{
    public void Configure(EntityTypeBuilder<OperationPlanDataModel> builder)
    {
        builder.HasKey(d => d.Id);
        
        builder.HasIndex(d => d.TargetDay).IsUnique();

        builder.HasMany(d => d.OperationList).WithMany()
            .UsingEntity(j => j.ToTable("OperationPlanOperations"));

        builder.Property(d => d.Author)
            .IsRequired();

        builder.Property(d => d.Algorithm)
            .IsRequired();

        builder.Property(d => d.CreatedAt)
            .IsRequired();

        builder.Property(d => d.LastModifiedAt)
            .IsRequired();
            
    }

}