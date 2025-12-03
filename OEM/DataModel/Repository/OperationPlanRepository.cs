namespace DataModel.Repository;

using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Domain.Model;


public class OperationPlanRepository : GenericRepository<OperationPlan>, IOperationPlanRepository
{
    OperationPlanMapper _mapper;

    public OperationPlanRepository(OEMContext context, OperationPlanMapper mapper) : base(context!)
    {
        _mapper = mapper;
    }

    public async Task<IEnumerable<OperationPlan>> GetAllOperationPlansAsync()
    {
        try
        {
            IEnumerable<OperationPlanDataModel> operationDataModels = await _context.Set<OperationPlanDataModel>()
                .ToListAsync();
            IEnumerable<OperationPlan> operationPlans = _mapper.ToDomain(operationDataModels);
            return operationPlans;
        }
        catch
        {
            throw;
        }
    }

    public async Task<OperationPlan?> GetOperationPlanByIdAsync(long id)
    {
        try
        {
            OperationPlanDataModel? operationDataModel = await _context.Set<OperationPlanDataModel>()
                .SingleOrDefaultAsync(op => op.Id == id);
            if (operationDataModel != null)
            {
                OperationPlan operationPlan = _mapper.ToDomain(operationDataModel);
                return operationPlan;
            }
            return null;
        }
        catch
        {
            return null;throw;
        }
    }

    public async Task<OperationPlan?> GetOperationPlanByAuthorAsync(string author)
    {
        try
        {
            OperationPlanDataModel? operationDataModel = await _context.Set<OperationPlanDataModel>()
                .SingleOrDefaultAsync(op => op.Author == author);
            if (operationDataModel != null)
            {
                OperationPlan operationPlan = _mapper.ToDomain(operationDataModel);
                return operationPlan;
            }
            return null;
        }
        catch
        {
            return null;throw;
        }
    }

    public async Task<OperationPlan?> GetOperationPlanByAlgorithmAsync(string algorithm)
    {
        try
        {
            OperationPlanDataModel? operationDataModel = await _context.Set<OperationPlanDataModel>()
                .SingleOrDefaultAsync(op => op.Algorithm == algorithm);
            if (operationDataModel != null)
            {
                OperationPlan operationPlan = _mapper.ToDomain(operationDataModel);
                return operationPlan;
            }
            return null;
        }
        catch
        {
            return null;throw;
        }
    }


    public async Task<OperationPlan?> GetOperationPlanByTargetDayAsync(DateTime targetDay)
    {
        try
        {
            OperationPlanDataModel? operationDataModel = await _context.Set<OperationPlanDataModel>()
                .SingleOrDefaultAsync(op => op.TargetDay.Date == targetDay.Date);
            if (operationDataModel != null)
            {
                OperationPlan operationPlan = _mapper.ToDomain(operationDataModel);
                return operationPlan;
            }
            return null;
        }
        catch
        {
            return null;throw;
        }
    }

    public async Task<OperationPlan> AddOperationPlan(OperationPlan operationPlan)
    {
        try
        {
            OperationPlanDataModel operationDataModel = _mapper.ToDataModel(operationPlan);
            EntityEntry<OperationPlanDataModel> addedEntity = _context.Set<OperationPlanDataModel>().Add(operationDataModel);
            await _context.SaveChangesAsync();
            OperationPlanDataModel addedOperationDataModel = addedEntity.Entity;
            OperationPlan addedOperationPlan = _mapper.ToDomain(addedOperationDataModel);
            return addedOperationPlan;
        }
        catch
        {
            throw;
        }
    }

    public async Task<OperationPlan?> Update(OperationPlan operationPlan, List<string> errorMessages)
    {
        try
        {
            OperationPlanDataModel? existingDataModel = await _context.Set<OperationPlanDataModel>()
                .SingleOrDefaultAsync(op => op.Id == operationPlan.Id);
            if (existingDataModel == null)
            {
                errorMessages.Add($"Operation Plan with ID {operationPlan.Id} not found.");
                return null;
            }
            _mapper.UpdateDataModel(operationPlan, existingDataModel, _context);

            await _context.SaveChangesAsync();

            return _mapper.ToDomain(existingDataModel);

        }
        catch (Exception ex)
        {
            errorMessages.Add($"An error occurred while updating the Operation Plan: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> OperationPlanExists(long id)
    {
        return await _context.Set<OperationPlanDataModel>().AnyAsync(op => op.Id == id);
    }
            
}
