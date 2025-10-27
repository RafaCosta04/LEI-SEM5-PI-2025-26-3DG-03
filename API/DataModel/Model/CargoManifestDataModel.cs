namespace DataModel.Model;



using Domain.Model;



public class CargoManifestDataModel
{
    public long Id { get; set; }

    public string? Type { get; set; }

    public List<CargoManifestEntryDataModel> Entries { get; set; } = null!;

    public long VesselVisitNotificationId { get; set; }
    public VesselVisitNotificationDataModel VesselVisitNotification { get; set; } = null!;

    public CargoManifestDataModel() { }

    public CargoManifestDataModel(CargoManifest cargoManifest)
    {
        Id = cargoManifest.Id;
        Type = cargoManifest.ManifestType.ToString();
        Entries = cargoManifest.Entries!.ConvertAll(e => new CargoManifestEntryDataModel(e));
        VesselVisitNotificationId = cargoManifest.VesselVisitNotificationId;
    }
}