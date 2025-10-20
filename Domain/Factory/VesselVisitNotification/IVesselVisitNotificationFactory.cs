namespace Domain.Factory;

using Domain.Model;

public interface IVesselVisitNotificationFactory
{
    VesselVisitNotification NewVesselVisitNotification(string code, VesselRecord vessel, Representative representative, DateTime eta, DateTime etd, List<CargoManifest> cargoManifests, CargoType cargoType, double volume, List<CrewMember> crewMembers);
}
