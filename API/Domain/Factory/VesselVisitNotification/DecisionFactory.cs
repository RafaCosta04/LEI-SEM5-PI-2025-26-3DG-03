namespace Domain.Factory;

using Domain.Model;

public class DecisionFactory : IDecisionFactory
{
    public Decision NewDecision(DecisionStatus status, string responseMessage, long officerId, VesselVisitNotification vesselVisitNotification)
    {
        return new Decision(status, responseMessage, officerId, vesselVisitNotification);
    }
}