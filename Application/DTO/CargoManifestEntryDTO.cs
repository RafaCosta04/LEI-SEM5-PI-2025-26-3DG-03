namespace Application.DTO;



using Domain.Model;


public class CargoManifestEntryDTO
{
    public string ContainerNumber { get; set; } = string.Empty;

    public int Row { get; set; }

    public int Bay { get;  set; }

    public int Tier { get; set; }

    public string StorageAreaCode { get; set; } = string.Empty;


}