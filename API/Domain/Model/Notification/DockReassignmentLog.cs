namespace Domain.Model;

public class DockReassignmentLog
{
    public int Id { get; set; }
    public DateTime TimeStamp { get; set; }

    public long OfficerId { get; private set; }

    public Dock? OriginalDock { get; private set; }

    public Dock UpdatedDock { get; private set; }

    public DockReassignmentLog(long officerId, Dock? originalDock, Dock updatedDock, DateTime? timeStamp = null)
    {
        OfficerId = officerId;
        OriginalDock = originalDock;
        UpdatedDock = updatedDock ?? throw new ArgumentNullException(nameof(updatedDock));
        TimeStamp = timeStamp ?? DateTime.UtcNow;
    }
}