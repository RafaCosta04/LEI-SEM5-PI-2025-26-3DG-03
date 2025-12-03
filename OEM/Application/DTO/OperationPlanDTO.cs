namespace Application.DTO;

using Domain.Model;

public class OperationPlanDTO
{
    public long Id { get; set; }

    public List<OperationEntry>? OperationList { get; set; }

    public DateTime TargetDay { get; set; }

    public string? Author { get; set; }

    public string? Algorithm { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime LastModifiedAt { get; set; }

    public OperationPlanDTO() { }

    public OperationPlanDTO(long id, List<OperationEntry> operationList, DateTime targetDay, string author, string algorithm, DateTime createdAt)
    {
        Id = id;
        OperationList = operationList;
        TargetDay = targetDay;
        Author = author;
        Algorithm = algorithm;
        CreatedAt = createdAt;
    }

    static public OperationPlanDTO ToDTO(OperationPlan operationPlan)
    {
        try
        {
            OperationPlanDTO operationPlanDTO = new OperationPlanDTO(operationPlan.Id, operationPlan.OperationList!, operationPlan.TargetDay!, operationPlan.Author!, operationPlan.Algorithm!, operationPlan.CreatedAt);
            operationPlanDTO.LastModifiedAt = operationPlan.LastModifiedAt;
            return operationPlanDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to OperationPlanDTO: {ex.Message}");
        }
    }
    static public IEnumerable<OperationPlanDTO> ToDTO(IEnumerable<OperationPlan> operationPlans)
    {
        List<OperationPlanDTO> operationPlanDTOs = new List<OperationPlanDTO>();
        foreach (OperationPlan operationPlan in operationPlans)
        {
            OperationPlanDTO operationPlanDTO = ToDTO(operationPlan);
            operationPlanDTOs.Add(operationPlanDTO);
        }
        return operationPlanDTOs;
    }
}