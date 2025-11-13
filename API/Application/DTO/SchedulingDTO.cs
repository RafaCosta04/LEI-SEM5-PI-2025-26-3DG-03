namespace Application.DTO;


public class SchedulingDTO
{
    public String VesselName { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public List<String> AssignedCranes { get; set; }

    public List<String> StaffNames { get; set; }

    public SchedulingDTO(string vesselName, DateTime startTime, DateTime endTime, List<String> assignedCrane, List<String> staffNames)
    {
        VesselName = vesselName;
        StartTime = startTime;
        EndTime = endTime;
        AssignedCranes = assignedCrane;
        StaffNames = staffNames;
    }

}