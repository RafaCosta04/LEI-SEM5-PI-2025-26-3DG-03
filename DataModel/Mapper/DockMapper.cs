namespace DataModel.Mapper;

using DataModel.Model;

using Domain.Model;
using Domain.Factory;

public class DockMapper
{

    private readonly IDockFactory _dockFactory;

    public DockMapper(IDockFactory dockFactory)
    {
        _dockFactory = dockFactory;
    }

    public Dock ToDomain(DockDataModel dockDM)
    {
        Dock dockDomain = _dockFactory.NewDock(dockDM.Name!, dockDM.Location!, dockDM.Length, dockDM.Depth, dockDM.MaxDraft, dockDM.VesselTypesAllowed!.Select(vt => new VesselTypeMapper(new Domain.Factory.VesselTypeFactory()).ToDomain(vt)).ToList());
        dockDomain.Id = dockDM.Id;
        return dockDomain;
    }

    public IEnumerable<Dock> ToDomain(IEnumerable<DockDataModel> dockDataModels)
    {
        List<Dock> docksDomain = new List<Dock>();

        foreach (DockDataModel dockDataModel in dockDataModels)
        {
            Dock dock = ToDomain(dockDataModel);
            docksDomain.Add(dock);
        }
        return docksDomain.AsEnumerable();
    }

    public DockDataModel ToDataModel(Dock dock)
    {
        DockDataModel dockDM = new DockDataModel(dock);
        return dockDM;
    }

    public void UpdateDataModel(DockDataModel dockDM, Dock dock)
    {
        dockDM.Name = dock.Name;
        dockDM.Location = dock.Location;
        dockDM.Length = dock.Length;
        dockDM.Depth = dock.Depth;
        dockDM.MaxDraft = dock.MaxDraft;
        dockDM.VesselTypesAllowed = dock.VesselTypesAllowed!.Select(vt => new VesselTypeMapper(new Domain.Factory.VesselTypeFactory()).ToDataModel(vt)).ToList();
    }




}