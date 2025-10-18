namespace Domain.Factory;

using Domain.Model;

public class DockFactory : IDockFactory
{
    public Dock NewDock(string name, string location, int length, int depth, int maxDraft, List<VesselType> vesselTypes)
    {
        return new Dock(name, location, length, depth, maxDraft, vesselTypes);
    }
}