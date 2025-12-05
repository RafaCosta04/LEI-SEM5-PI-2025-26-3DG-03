namespace DataModel.Mapper;

using DataModel.Model;

using Domain.Model;
using Domain.Factory;
using DataModel.Repository;
using Microsoft.EntityFrameworkCore;

public class DockReassignmentLogMapper
{
    private readonly DockMapper _dockMapper;

    public DockReassignmentLogMapper(DockMapper dockMapper)
    {
        _dockMapper = dockMapper;
    }

    public DockReassignmentLog ToDomain(DockReassignmentLogDataModel dockReassignmentLogDM)
    {
        return new DockReassignmentLog(dockReassignmentLogDM.OfficerId,
            _dockMapper.ToDomain(dockReassignmentLogDM.OriginalDock!),
            _dockMapper.ToDomain(dockReassignmentLogDM.UpdatedDock),
            dockReassignmentLogDM.TimeStamp
        );
    }
    public DockReassignmentLogDataModel ToDataModel(DockReassignmentLog dockReassignmentLog)
    {
        return new DockReassignmentLogDataModel(dockReassignmentLog);
    }
}