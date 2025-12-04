namespace Application.DTO;

public class DataRebalancingDTO
{
    public List<VesselVisitNotificationDTO> VesselVisitNotifications { get; set; }
    public List<DockRebalancingDTO> Docks { get; set; }

    public DataRebalancingDTO(List<VesselVisitNotificationDTO> vesselVisitNotifications, List<DockRebalancingDTO> docks)
    {
        VesselVisitNotifications = vesselVisitNotifications;
        Docks = docks ?? new List<DockRebalancingDTO>();
    }
}