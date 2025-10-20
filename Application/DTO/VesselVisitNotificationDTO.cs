namespace Application.DTO;

using System.Text.Json.Serialization;


using Domain.Model;


public class VesselVisitNotificationDTO
{
    public string Code { get; set; } = string.Empty;
    public string VesselIMO { get; set; } = null!;
    public string RepresentativeCitizenID { get; set; } = null!;
    public DateTime Eta { get; set; }
    public DateTime Etd { get; set; }
    public List<CargoManifestDTO>? CargoManifests { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public CargoType CargoType { get; set; }
    public double Volume { get; set; }
    public List<CrewMemberDTO> CrewMembers { get; set; } = null!;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public VisitStatus VisitStatus { get; set; }

    public DateTime LastModifiedAt { get; set; }


    private VesselVisitNotificationDTO() { }


    public VesselVisitNotificationDTO(string code, string vesselIMO, string representativeCitizenID, DateTime eta, DateTime etd, List<CargoManifestDTO>? cargoManifests, CargoType cargoType, double volume, List<CrewMemberDTO> crewMembers, VisitStatus visitStatus)
    {
        Code = code;
        VesselIMO = vesselIMO;
        RepresentativeCitizenID = representativeCitizenID;
        Eta = eta;
        Etd = etd;
        CargoManifests = cargoManifests;
        CargoType = cargoType;
        Volume = volume;
        CrewMembers = crewMembers;
        VisitStatus = visitStatus;
        LastModifiedAt = DateTime.UtcNow;
    }

    static public VesselVisitNotificationDTO ToDTO(VesselVisitNotification vesselVisitNotification)
    {
        try
        {
            List<CargoManifestDTO> cargoManifestDTOs = new List<CargoManifestDTO>();
            foreach (CargoManifest cargoManifest in vesselVisitNotification.CargoManifests)
            {
                CargoManifestDTO cargoManifestDTO = new CargoManifestDTO
                {
                    ManifestType = cargoManifest.ManifestType,
                    Entries = cargoManifest.Entries!.Select(e => new CargoManifestEntryDTO
                    {
                        ContainerNumber = e.Container.ContainerNumber,
                        Row = e.Row,
                        Tier = e.Tier,
                        Bay = e.Bay,
                        StorageAreaCode = e.StorageArea.Code
                    }).ToList()
                };
                cargoManifestDTOs.Add(cargoManifestDTO);
            }

            List<CrewMemberDTO> crewMemberDTOs = vesselVisitNotification.CrewMembers.Select(cm => new CrewMemberDTO
            {
                Name = cm.Name,
                CitizenID = cm.CitizenId,
                Rank = cm.Rank,
                Nationality = cm.Nationality
            }
            ).ToList();
            VesselVisitNotificationDTO vesselVisitNotificationDTO = new VesselVisitNotificationDTO(vesselVisitNotification.Code, vesselVisitNotification.Vessel.IMONumber!, vesselVisitNotification.Representative.CitizenId!, vesselVisitNotification.ETA, vesselVisitNotification.ETD, cargoManifestDTOs, vesselVisitNotification.CargoType, vesselVisitNotification.Volume, crewMemberDTOs, vesselVisitNotification.VisitStatus);
            vesselVisitNotificationDTO.LastModifiedAt = vesselVisitNotification.LastModifiedAt;
            return vesselVisitNotificationDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to VesselVisitNotificationDTO: {ex.Message}");
        }
    }

    static public IEnumerable<VesselVisitNotificationDTO> ToDTO(IEnumerable<VesselVisitNotification> vesselVisitNotifications)
    {
        List<VesselVisitNotificationDTO> vesselVisitNotificationDTOs = new List<VesselVisitNotificationDTO>();
        foreach (VesselVisitNotification vesselVisitNotification in vesselVisitNotifications)
        {
            VesselVisitNotificationDTO vesselVisitNotificationDTO = ToDTO(vesselVisitNotification);
            vesselVisitNotificationDTOs.Add(vesselVisitNotificationDTO);
        }
        return vesselVisitNotificationDTOs;
    }
}