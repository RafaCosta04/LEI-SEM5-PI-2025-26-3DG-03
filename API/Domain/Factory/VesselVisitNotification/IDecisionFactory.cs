namespace Domain.Factory;

using Domain.Model;
using ShippingManagement.Domain.Qualifications;

public interface IDecisionFactory
{
    Decision NewDecision(DecisionStatus status, string responseMessage, long officerId, VesselVisitNotification vesselVisitNotification);
}