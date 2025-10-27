using System.ComponentModel.DataAnnotations;

namespace Domain.Model;

public enum DecisionStatus
{
    Approved,
    Rejected
}

public class Decision
{
    public long Id { get; set; }
    public DecisionStatus Status { get; set; }
    public string ResponseMessage { get; set; } = string.Empty;
    public DateTime DecisionDate { get; set; }
    public VesselVisitNotification VesselVisitNotification { get; set; } = null!;
    public long OfficerId { get; set; }
    private Decision() { }

    public Decision(DecisionStatus status, string responseMessage, long officerId, VesselVisitNotification vesselVisitNotification)
    {
        ValidateStatus(status);
        ValidateResponseMessage(responseMessage, status);

        Status = status;
        ResponseMessage = responseMessage;
        DecisionDate = DateTime.UtcNow;
        OfficerId = officerId;
        VesselVisitNotification = vesselVisitNotification;
    }

    private void ValidateStatus(DecisionStatus status)
    {
        if (!Enum.IsDefined(typeof(DecisionStatus), status))
        {
            throw new ArgumentException("Invalid decision status.");
        }
    }

    private void ValidateResponseMessage(string responseMessage, DecisionStatus status)
    {
        if (status == DecisionStatus.Approved)
        {
            if (string.IsNullOrWhiteSpace(responseMessage))
            {
                throw new ArgumentException("Response message cannot be empty, provide a temporary dock.");
            }
        }
        else if (status == DecisionStatus.Rejected)
        {
            if (string.IsNullOrWhiteSpace(responseMessage))
            {
                throw new ArgumentException("Response message cannot be empty, provide a reason for rejection.");
            }
        }
    }
}