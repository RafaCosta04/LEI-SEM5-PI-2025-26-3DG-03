namespace Application.DTO;

using System.Text.Json.Serialization;
using Domain.Model;



public class CargoManifestDTO
{

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public CargoManifestType ManifestType { get; set; }
    public List<CargoManifestEntryDTO>? Entries { get; set; }

}