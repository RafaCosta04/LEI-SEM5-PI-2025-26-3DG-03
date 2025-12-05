namespace DataModel.Model;

using Domain.Model;

public class DockReassignmentLogDataModel
{
    public int Id { get; set; }

    public DateTime TimeStamp { get; set; }

    public long OfficerId { get; set; }

    public DockDataModel? OriginalDock { get; set; } = null;

    public DockDataModel UpdatedDock { get; set; } = null!;

    public long VesselVisitNotificationId { get; set; }

    public VesselVisitNotificationDataModel? VesselVisitNotification { get; set; }

    public DockReassignmentLogDataModel() { }

    public DockReassignmentLogDataModel(DockReassignmentLog dockReassignmentLog)
    {
        Id = dockReassignmentLog.Id;
        TimeStamp = dockReassignmentLog.TimeStamp;
        OfficerId = dockReassignmentLog.OfficerId;
        OriginalDock = dockReassignmentLog.OriginalDock != null ? new DockDataModel(dockReassignmentLog.OriginalDock) : null;
        UpdatedDock = new DockDataModel(dockReassignmentLog.UpdatedDock);
    }
}