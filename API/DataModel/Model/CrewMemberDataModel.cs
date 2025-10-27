namespace DataModel.Model;


using Domain.Model;


public class CrewMemberDataModel
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string CitizenId { get; set; } = string.Empty;

    public string? Rank { get; set; } = string.Empty;

    public string Nationality { get; set; } = string.Empty;

    public CrewMemberDataModel() { }

    public CrewMemberDataModel(CrewMember crewMember)
    {
        Id = crewMember.Id;
        Name = crewMember.Name;
        CitizenId = crewMember.CitizenId;
        Nationality = crewMember.Nationality;
        Rank = crewMember.Rank.ToString();
    }
}
