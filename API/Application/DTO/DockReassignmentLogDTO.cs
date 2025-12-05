namespace Application.DTO;

using Domain.Model;


public class DockReassignmentLogDTO
{
    public DateTime TimeStamp { get; set; }
    public long OfficerId { get; set; }
    public DockDTO? OriginalDock { get; set; }
    public DockDTO UpdatedDock { get; set; } = null!;

    public DockReassignmentLogDTO() { }

    public DockReassignmentLogDTO(DateTime timeStamp, long officerId, DockDTO? originalDock, DockDTO updatedDock)
    {
        TimeStamp = timeStamp;
        OfficerId = officerId;
        OriginalDock = originalDock;
        UpdatedDock = updatedDock;
    }

    static public DockReassignmentLogDTO ToDTO(DockReassignmentLog log)
    {
        DockDTO? original = null;
        if (log.OriginalDock != null)
        {
            original = DockDTO.ToDTO(log.OriginalDock);
        }
        var updated = DockDTO.ToDTO(log.UpdatedDock);
        return new DockReassignmentLogDTO(log.TimeStamp, log.OfficerId, original, updated);
    }

    static public IEnumerable<DockReassignmentLogDTO> ToDTO(IEnumerable<DockReassignmentLog> logs)
    {
        List<DockReassignmentLogDTO> list = new List<DockReassignmentLogDTO>();
        foreach (var l in logs)
        {
            list.Add(ToDTO(l));
        }
        return list;
    }
}
