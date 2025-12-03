namespace DataModel.Model;

using System.ComponentModel.DataAnnotations;
using System.Net.NetworkInformation;
using Domain.Model;

public class OperationEntryDataModel
{
    public DateTime LastModifiedAt { get; set; }

    public long Id { get; set; }

    [Required]
    public string? VesselName { get; set; }

    [Required]
    public DateTime ArrivalTime { get; set; }

    [Required]
    public DateTime DepartureTime { get; set; }

    [Required]
    public List<string>? Cranes { get; set; }

    [Required]
    public List<string>? StaffMembers { get; set; }

    public OperationEntryDataModel() {}

    public OperationEntryDataModel(OperationEntry entry)
    {
        Id = entry.Id;
        VesselName = entry.VesselName;
        ArrivalTime = entry.ArrivalTime;
        DepartureTime = entry.DepartureTime;
        Cranes = entry.Cranes;
        StaffMembers = entry.StaffMembers;
        LastModifiedAt = entry.LastModifiedAt;
    }
}