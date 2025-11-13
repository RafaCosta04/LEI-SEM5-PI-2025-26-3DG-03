namespace Application.DTO;


public class DataScheduleDTO
{
    public List<VesselVisitNotificationDTO> VesselVisitNotifications { get; set; }

    public PhysicalResourceDTO AssignedCrane { get; set; }

    public DataScheduleDTO(List<VesselVisitNotificationDTO> vesselVisitNotifications, PhysicalResourceDTO assignedCrane)
    {
        VesselVisitNotifications = vesselVisitNotifications;
        AssignedCrane = assignedCrane;
    }
}