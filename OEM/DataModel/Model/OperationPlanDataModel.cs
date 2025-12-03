namespace DataModel.Model;

using System.ComponentModel.DataAnnotations;
using System.Net.NetworkInformation;
using Domain.Model;

public class OperationPlanDataModel
{
    public DateTime LastModifiedAt { get; set; }

    public long Id { get; set; }

    [Required]
    public List<OperationEntry>? OperationList { get; set;}

    [Required]
    public DateTime TargetDay { get; set;}

    [Required]
    public string? Author { get; set;}

    [Required]
    public string? Algorithm { get; set;}

    [Required]
    public DateTime CreatedAt { get; set;}

    public OperationPlanDataModel() {}

    public OperationPlanDataModel(OperationPlan plan)
    {
        Id = plan.Id;
        OperationList = plan.OperationList;
        TargetDay = plan.TargetDay;
        Author = plan.Author;
        Algorithm = plan.Algorithm;
        CreatedAt = plan.CreatedAt;
        LastModifiedAt = plan.LastModifiedAt;
    }
}