namespace Application.DTO;


using Domain.Model;

using System.Text.Json.Serialization;


public class CrewMemberDTO
{
    public string Name { get; set; } = string.Empty;

    public string CitizenID { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public CrewRank Rank { get; set; }

    public string Nationality { get; set; } = string.Empty;

}