namespace Domain.Factory;

using Domain.Model;

public interface IDockFactory
{
    Dock NewDock(string name, string location, int length, int depth, int maxDraft, List<VesselType> vesselTypes);
}