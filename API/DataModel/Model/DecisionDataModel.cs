namespace DataModel.Model;

using System.ComponentModel.DataAnnotations;
using Domain.Model;

public class DecisionDataModel
{
    public long Id { get; set; }
    [Required]
    public long OfficerId { get; set; }
    [Required]
    public VesselVisitNotificationDataModel VesselVisitNotification { get; set; } = null!;
    [Required]
    public DateTime DecisionDate { get; set; }
    [Required]
    public DecisionStatus Status { get; set; }
    [Required]
    public string ResponseMessage { get; set; } = string.Empty;
    public DecisionDataModel() { }
    public DecisionDataModel(Decision decision)
    {
        Id = decision.Id;
        OfficerId = decision.OfficerId;
        VesselVisitNotification = new VesselVisitNotificationDataModel(decision.VesselVisitNotification);
        DecisionDate = decision.DecisionDate;
        Status = decision.Status;
        ResponseMessage = decision.ResponseMessage;
    }
}