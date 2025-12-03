namespace DataModel.Mapper;

using DataModel.Model;

using Domain.Model;
using Domain.Factory;
using DataModel.Repository;
using Microsoft.EntityFrameworkCore;
using Azure;

public class OperationPlanMapper
{
    private readonly IOperationPlanFactory _operationPlanFactory;

    public OperationPlanMapper(IOperationPlanFactory operationPlanFactory)
    {
        _operationPlanFactory = operationPlanFactory;
    }

    public OperationPlan ToDomain(OperationPlanDataModel operationDataModel)
    {
        OperationPlan operationDomain = _operationPlanFactory.NewOperationPlan(operationDataModel.OperationList!, operationDataModel.TargetDay, operationDataModel.Author!, operationDataModel.Algorithm!, operationDataModel.CreatedAt);
        operationDomain.Id = operationDataModel.Id;
        operationDomain.LastModifiedAt = operationDataModel.LastModifiedAt;
        return operationDomain;
    }

    public IEnumerable<OperationPlan> ToDomain(IEnumerable<OperationPlanDataModel> operationDataModels)
    {
        List<OperationPlan> operationsDomain = new List<OperationPlan>();

        foreach (OperationPlanDataModel operationDataModel in operationDataModels)
        {
            OperationPlan operationPlan = ToDomain(operationDataModel);
            operationsDomain.Add(operationPlan);
        }
        return operationsDomain.AsEnumerable();
    }

    public OperationPlanDataModel ToDataModel(OperationPlan operationPlan)
    {
        OperationPlanDataModel operationDM = new OperationPlanDataModel(operationPlan);
        operationDM.LastModifiedAt = operationPlan.LastModifiedAt;
        return operationDM;
    }

    public void UpdateDataModel(OperationPlan operationPlan, OperationPlanDataModel operationDataModel, OEMContext dbContext)
    {
        operationDataModel.OperationList = operationPlan.OperationList;
        operationDataModel.TargetDay = operationPlan.TargetDay;
        operationDataModel.Author = operationPlan.Author;
        operationDataModel.Algorithm = operationPlan.Algorithm;
        operationDataModel.LastModifiedAt = operationPlan.LastModifiedAt;
    }
}