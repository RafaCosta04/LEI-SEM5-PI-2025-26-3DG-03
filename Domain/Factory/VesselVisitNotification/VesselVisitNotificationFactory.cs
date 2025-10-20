namespace Domain.Factory;



using Domain.Model;

public class VesselVisitNotificationFactory : IVesselVisitNotificationFactory
{
    public VesselVisitNotification NewVesselVisitNotification(string code, VesselRecord vessel, Representative representative, DateTime eta, DateTime etd, List<CargoManifest> cargoManifests, CargoType cargoType, double volume, List<CrewMember> crewMembers)
    {
        return new VesselVisitNotification(code, vessel, representative, eta, etd, cargoManifests, cargoType, volume, crewMembers);
    }
}