namespace DataModel.Mapper;

using DataModel.Model;

using Domain.Model;
using Domain.Factory;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

public class DecisionMapper
{
    private readonly IDecisionFactory _decisionFactory;
    private readonly VesselVisitNotificationMapper _vesselVisitNotificationMapper;
    public DecisionMapper(IDecisionFactory decisionFactory, VesselVisitNotificationMapper vesselVisitNotificationMapper)
    {
        _decisionFactory = decisionFactory;
        _vesselVisitNotificationMapper = vesselVisitNotificationMapper;
    }

    public Decision ToDomain(DecisionDataModel decisionDM)
    {
        VesselVisitNotification vesselVisit = _vesselVisitNotificationMapper.ToDomain(decisionDM.VesselVisitNotification);
        Decision decisionDomain = _decisionFactory.NewDecision(
            decisionDM.Status,
            decisionDM.ResponseMessage,
            decisionDM.OfficerId,
            vesselVisit
        );
        decisionDomain.DecisionDate = decisionDM.DecisionDate;
        decisionDomain.Id = decisionDM.Id;
        return decisionDomain;
    }

    public DecisionDataModel ToDataModel(Decision decision)
    {
        return new DecisionDataModel(decision);
    }

    public async Task UpdateDataModelAsync(DecisionDataModel decisionDM, Decision decision, DbContext context)
    {
        decisionDM.OfficerId = decision.OfficerId;
        decisionDM.DecisionDate = decision.DecisionDate;
        decisionDM.Status = decision.Status;
        decisionDM.ResponseMessage = decision.ResponseMessage;

        long vvnId = decision.VesselVisitNotification.Id;
        var vesselVisitNotification = await context.Set<VesselVisitNotificationDataModel>().FindAsync(vvnId);

        if (vesselVisitNotification != null)
        {
            decisionDM.VesselVisitNotification = vesselVisitNotification;
        }
        else
        {
            decisionDM.VesselVisitNotification = _vesselVisitNotificationMapper.ToDataModel(decision.VesselVisitNotification);
            context.Attach(decisionDM.VesselVisitNotification);
        }
    }
}