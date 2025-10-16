namespace Application.DTO;

using Domain.Model;

public class OperationalWindowDTO
{
    public DayOfWeek? StartDay { get; set; }
    public DayOfWeek? EndDay { get; set; }
    public string? StartTime { get; set; } 
    public string? EndTime { get; set; }
    public OperationalWindowDTO() { }
    public OperationalWindowDTO(DayOfWeek? startDay, DayOfWeek? endDay, string? startTime, string? endTime)
    {
        StartDay = startDay;
        EndDay = endDay;
        StartTime = startTime;
        EndTime = endTime;
    }
    public static OperationalWindowDTO ToDTO(OperationalWindow operationalWindow)
    {
        try
        {
            OperationalWindowDTO operationalWindowDTO = new OperationalWindowDTO(operationalWindow.StartDay, operationalWindow.EndDay, operationalWindow.StartTime.ToString(@"hh\:mm"), operationalWindow.EndTime.ToString(@"hh\:mm"));
            return operationalWindowDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to StaffDTO: {ex.Message}");
        }
    }

    public static OperationalWindow ToDomain(OperationalWindowDTO dto)
    {
        if (dto.StartDay == null)
            throw new InvalidOperationException("StartDay cannot be null.");

        if (dto.EndDay == null)
            throw new InvalidOperationException("EndDay cannot be null.");

        if (dto.StartTime == null)
            throw new InvalidOperationException("StartTime cannot be null.");
        
        if (dto.EndTime == null)
            throw new InvalidOperationException("EndTime cannot be null.");

        return new OperationalWindow(dto.StartDay!.Value, dto.EndDay!.Value, TimeSpan.Parse(dto.StartTime!), TimeSpan.Parse(dto.EndTime!));
    }
}