namespace Application.Services;

using Domain.Model;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using Application.DTO;
using Domain.Factory;


public class OperationPlanService
{
    private readonly IOperationPlanRepository _operationPlanRepository;
    private readonly IOperationPlanFactory _operationPlanFactory;

    public OperationPlanService(IOperationPlanRepository operationPlanRepository, IOperationPlanFactory operationPlanFactory)
    {
        _operationPlanRepository = operationPlanRepository;
        _operationPlanFactory = operationPlanFactory;
    }

    public async Task<IEnumerable<OperationPlanDTO>> GetAllOperationPlans()
    {
        IEnumerable<OperationPlan> operationPlans = await _operationPlanRepository.GetAllOperationPlansAsync();
        IEnumerable<OperationPlanDTO> operationPlanDTOs = OperationPlanDTO.ToDTO(operationPlans);
        return operationPlanDTOs;
    }

    public async Task<OperationPlanDTO?> GetOperationPlanById(long id)
    {
        OperationPlan? operationPlan = await _operationPlanRepository.GetOperationPlanByIdAsync(id);
        if (operationPlan != null)
        {
            OperationPlanDTO operationPlanDTO = OperationPlanDTO.ToDTO(operationPlan);
            return operationPlanDTO;
        }
        return null;
    }

    public async  Task<OperationPlanDTO?> GetOperationPlanByAuthor(string author)
    {
        OperationPlan? operationPlan = await _operationPlanRepository.GetOperationPlanByAuthorAsync(author);
        if (operationPlan != null)
        {
            OperationPlanDTO operationPlanDTO = OperationPlanDTO.ToDTO(operationPlan);
            return operationPlanDTO;
        }
        return null;
    }

    public async Task<OperationPlanDTO?> GetOperationPlanByAlgorithm(string algorithm)
    {
        OperationPlan? operationPlan = await _operationPlanRepository.GetOperationPlanByAlgorithmAsync(algorithm);
        if (operationPlan != null)
        {
            OperationPlanDTO operationPlanDTO = OperationPlanDTO.ToDTO(operationPlan);
            return operationPlanDTO;
        }
        return null;
    }

    public async Task<OperationPlanDTO?> GetOperationPlanByTargetDay(DateTime targetDay)
    {
        OperationPlan? operationPlan = await _operationPlanRepository.GetOperationPlanByTargetDayAsync(targetDay);
        if (operationPlan != null)
        {
            OperationPlanDTO operationPlanDTO = OperationPlanDTO.ToDTO(operationPlan);
            return operationPlanDTO;
        }
        return null;
    }

    public async Task<OperationPlanDTO?> AddOperationPlan(OperationPlanDTO operationPlanDTO, List<string> errorMessages)
    {
        OperationPlan? operationPlan = await _operationPlanRepository.GetOperationPlanByTargetDayAsync(operationPlanDTO.TargetDay);
        if (operationPlan != null)
        {
            errorMessages.Add($"An operation plan for the day {operationPlanDTO.TargetDay.ToShortDateString()} already exists.");
            return null;
        }

        if (operationPlanDTO.OperationList == null || !operationPlanDTO.OperationList.Any())
        {
            errorMessages.Add("Operation list cannot be null or empty.");
            return null;
        }
        if (operationPlanDTO.OperationList != null)
        {
            foreach (var operationEntryId in operationPlanDTO.OperationList)
            {
                if (operationEntryId.VesselName == null || string.IsNullOrWhiteSpace(operationEntryId.VesselName))
                {
                    errorMessages.Add("Vessel name cannot be null or empty.");
                    return null;
                }
                if (operationEntryId.ArrivalTime >= operationEntryId.DepartureTime)
                {
                    errorMessages.Add($"In operation entry for vessel '{operationEntryId.VesselName}', arrival time must be earlier than departure time.");
                    return null;
                }
                if (operationEntryId.Cranes == null || operationEntryId.Cranes.Count == 0)
                {
                    errorMessages.Add($"In operation entry for vessel '{operationEntryId.VesselName}', at least one crane must be assigned.");
                    return null;
                }
                if (operationEntryId.StaffMembers == null || operationEntryId.StaffMembers.Count == 0)
                {
                    errorMessages.Add($"In operation entry for vessel '{operationEntryId.VesselName}', at least one staff member must be assigned.");
                }
                
            }

        }

        try
        {
            operationPlan = _operationPlanFactory.NewOperationPlan(operationPlanDTO.OperationList!, operationPlanDTO.TargetDay, operationPlanDTO.Author!, operationPlanDTO.Algorithm!, DateTime.UtcNow);
        }
        catch (ArgumentException ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return null;
        }
        OperationPlan operationPlanSaved = await _operationPlanRepository.AddOperationPlan(operationPlan);
        OperationPlanDTO opDTO = OperationPlanDTO.ToDTO(operationPlanSaved);
        return opDTO;
    }

    public async Task<bool> UpdateOperationPlan(long id, OperationPlanDTO operationPlanDTO, List<string> errorMessages)
    {
        if (string.IsNullOrWhiteSpace(operationPlanDTO.Author))
        {
            errorMessages.Add("Author cannot be null or empty.");
            return false;
        }
        if (string.IsNullOrWhiteSpace(operationPlanDTO.Algorithm))
        {
            errorMessages.Add("Algorithm cannot be null or empty.");
            return false;
        }
        if (operationPlanDTO.OperationList != null)
        {
            foreach (var operationEntryId in operationPlanDTO.OperationList)
            {
                if (operationEntryId.VesselName == null || string.IsNullOrWhiteSpace(operationEntryId.VesselName))
                {
                    errorMessages.Add("Vessel name cannot be null or empty.");
                    return false;
                }
                if (operationEntryId.ArrivalTime >= operationEntryId.DepartureTime)
                {
                    errorMessages.Add($"In operation entry for vessel '{operationEntryId.VesselName}', arrival time must be earlier than departure time.");
                    return false;
                }
                if (operationEntryId.Cranes == null || operationEntryId.Cranes.Count == 0)
                {
                    errorMessages.Add($"In operation entry for vessel '{operationEntryId.VesselName}', at least one crane must be assigned.");
                    return false;
                }
                if (operationEntryId.StaffMembers == null || operationEntryId.StaffMembers.Count == 0)
                {
                    errorMessages.Add($"In operation entry for vessel '{operationEntryId.VesselName}', at least one staff member must be assigned.");
                }
                
            }

        }

        
        if (operationPlanDTO.TargetDay < DateTime.UtcNow.Date)
        {
            errorMessages.Add("Target day cannot be in the past.");
            return false;
        }
        OperationPlan? existingOperationPlan = await _operationPlanRepository.GetOperationPlanByTargetDayAsync(operationPlanDTO.TargetDay);
        if (existingOperationPlan != null && existingOperationPlan.Id != id)
        {
            errorMessages.Add($"An operation plan for the day {operationPlanDTO.TargetDay.ToShortDateString()} already exists.");
            return false;
        }
        OperationPlan? operationPlanToUpdate = await _operationPlanRepository.GetOperationPlanByIdAsync(id);
        if (operationPlanToUpdate == null)
        {
            errorMessages.Add($"Operation plan with ID {id} does not exist.");
            return false;
        }
        try
        {
            operationPlanToUpdate.ChangeTargetDay(operationPlanDTO.TargetDay);
            operationPlanToUpdate.ChangeAlgorithm(operationPlanDTO.Algorithm);
            operationPlanToUpdate.ChangeOperationList(operationPlanDTO.OperationList!);
            operationPlanToUpdate.ChangeAuthor(operationPlanDTO.Author);
            await _operationPlanRepository.Update(operationPlanToUpdate, errorMessages);
            return true;
        }
        catch (ArgumentException ex)
        {
            errorMessages.Add("Error in updating Operation Plan: " + ex.Message);
            return false;
        }
    }

}