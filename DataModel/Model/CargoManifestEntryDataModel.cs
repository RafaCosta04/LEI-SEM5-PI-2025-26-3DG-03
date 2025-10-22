namespace DataModel.Model;

using Domain.Model;


public class CargoManifestEntryDataModel
{
    public long Id { get; set; }

    public string Container { get; set; } = null!;

    public int Row { get; set; }

    public int Bay { get; set; }

    public int Tier { get; set; }

    public long StorageAreaId { get; set; }

    public StorageAreaDataModel StorageArea { get; set; } = null!;

    public long CargoManifestId { get; set; }
    public CargoManifestDataModel CargoManifest { get; set; } = null!;

    public CargoManifestEntryDataModel() { }

    public CargoManifestEntryDataModel(CargoManifestEntry cargoManifestEntry)
    {
        Id = cargoManifestEntry.Id;
        Container = cargoManifestEntry.Container.ContainerNumber;
        Row = cargoManifestEntry.Row;
        Bay = cargoManifestEntry.Bay;
        Tier = cargoManifestEntry.Tier;
        StorageAreaId = cargoManifestEntry.StorageArea.Id;
        CargoManifestId = cargoManifestEntry.CargoManifestId;
    }
}