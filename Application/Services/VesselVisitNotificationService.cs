namespace Application.Services;

using Domain.Model;
using Domain.IRepository;
using Application.DTO;
using Domain.Factory;


public class VesselVisitNotificationService
{
    private readonly IVesselVisitNotificationRepository _vesselVisitNotificationRepository;
    private readonly IVesselRecordRepository _vesselRecordRepository;

    private readonly IRepresentativeRepository _representativeRepository;

    private readonly IStorageAreaRepository _storageAreaRepository;

    private readonly IVesselVisitNotificationFactory _vesselVisitNotificationFactory;

    public VesselVisitNotificationService(IVesselVisitNotificationRepository vesselVisitNotificationRepository, IVesselRecordRepository vesselRecordRepository, IVesselVisitNotificationFactory vesselVisitNotificationFactory, IRepresentativeRepository representativeRepository, IStorageAreaRepository storageAreaRepository)
    {
        _vesselVisitNotificationRepository = vesselVisitNotificationRepository;
        _vesselRecordRepository = vesselRecordRepository;
        _vesselVisitNotificationFactory = vesselVisitNotificationFactory;
        _representativeRepository = representativeRepository;
        _storageAreaRepository = storageAreaRepository;
    }

    public async Task<IEnumerable<VesselVisitNotificationDTO>> GetAllVesselVisitNotifications()
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetAllVisitsAsync();
        IEnumerable<VesselVisitNotificationDTO> notificationDTOs = VesselVisitNotificationDTO.ToDTO(notifications);
        return notificationDTOs;
    }

    public async Task<VesselVisitNotificationDTO?> GetVesselVisitNotificationByCode(string visitCode)
    {
        VesselVisitNotification? notification = await _vesselVisitNotificationRepository.GetVisitByCodeAsync(visitCode);
        if (notification != null)
        {
            VesselVisitNotificationDTO notificationDTO = VesselVisitNotificationDTO.ToDTO(notification);
            return notificationDTO;
        }
        return null;
    }

    public async Task<VesselVisitNotificationDTO?> GetVesselVisitNotificationById(long id)
    {
        VesselVisitNotification? notification = await _vesselVisitNotificationRepository.GetVisitByIdAsync(id);
        if (notification != null)
        {
            VesselVisitNotificationDTO notificationDTO = VesselVisitNotificationDTO.ToDTO(notification);
            return notificationDTO;
        }
        return null;
    }

    public async Task<IEnumerable<VesselVisitNotificationDTO>> GetVesselVisitNotificationByOrg(string orgCode)
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByOrgAsync(orgCode);
        IEnumerable<VesselVisitNotificationDTO> notificationDTOs = VesselVisitNotificationDTO.ToDTO(notifications);
        return notificationDTOs;
    }

    public async Task<IEnumerable<VesselVisitNotificationDTO>> GetVesselVisitNotificationsByVesselIMO_Org(string imoNumber, string orgCode)
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByVesselIMO_OrgAsync(imoNumber, orgCode);
        IEnumerable<VesselVisitNotificationDTO> notificationDTOs = VesselVisitNotificationDTO.ToDTO(notifications);
        return notificationDTOs;
    }

    public async Task<IEnumerable<VesselVisitNotificationDTO>> GetVesselVisitNotificationsByDateRange_Org(DateTime startDate, DateTime endDate, string orgCode)
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByDateRange_OrgAsync(startDate, endDate, orgCode);
        IEnumerable<VesselVisitNotificationDTO> notificationDTOs = VesselVisitNotificationDTO.ToDTO(notifications);
        return notificationDTOs;
    }

    public async Task<IEnumerable<VesselVisitNotificationDTO>> GetVesselVisitNotificationsByRepresentative(string citizenId)
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByRepresentativeAsync(citizenId);
        IEnumerable<VesselVisitNotificationDTO> notificationDTOs = VesselVisitNotificationDTO.ToDTO(notifications);
        return notificationDTOs;
    }

    public async Task<IEnumerable<VesselVisitNotificationDTO>> GetVesselVisitNotificationsByStatus_Org(VisitStatus status, string orgCode)
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByStatus_OrgAsync(status, orgCode);
        IEnumerable<VesselVisitNotificationDTO> notificationDTOs = VesselVisitNotificationDTO.ToDTO(notifications);
        return notificationDTOs;
    }

    public async Task<VesselVisitNotificationDTO> AddVesselVisitNotification(VesselVisitNotificationDTO notificationDTO)
    {
        string code = await GenerateUniqueVisitCodeAsync();
        notificationDTO.Code = code;
        VesselVisitNotification? vesselVisitNotification = await _vesselVisitNotificationRepository.GetVisitByCodeAsync(notificationDTO.Code);
        if (vesselVisitNotification != null)
        {
            throw new Exception("Vessel Visit Notification with the same code already exists.");
        }
        IEnumerable<VesselVisitNotification?> overlappingVisit = await _vesselVisitNotificationRepository.GetVisitsByVesselIMOAsync(notificationDTO.VesselIMO);
        if (overlappingVisit != null && overlappingVisit.Any(v => notificationDTO.Eta < v!.ETD && notificationDTO.Etd > v!.ETA))
        {
            throw new Exception("There is an overlapping visit for the same vessel.");
        }
        if (!Enum.IsDefined(typeof(CargoType), notificationDTO.CargoType))
        {
            throw new Exception("Invalid Cargo Type.");
        }
        VesselRecord? vessel = await _vesselRecordRepository.GetVesselRecordByImoNumberAsync(notificationDTO.VesselIMO);
        if (vessel == null)
        {
            throw new Exception("Vessel Record not found.");
        }
        Representative? representative = await _representativeRepository.GetRepresentativeByCitizenIdAsync(notificationDTO.RepresentativeCitizenID);
        if (representative == null)
        {
            throw new Exception("Representative not found.");
        }
        List<CrewMember> crewMembers = new List<CrewMember>();
        if (notificationDTO.CrewMembers != null)
        {
            crewMembers = ConvertCrewMemberDTOsToCrewMembers(notificationDTO.CrewMembers);
        }
        try
        {
            vesselVisitNotification = _vesselVisitNotificationFactory.NewVesselVisitNotification(
                notificationDTO.Code,
                vessel,
                representative,
                notificationDTO.Eta,
                notificationDTO.Etd,
                new List<CargoManifest>(),
                notificationDTO.CargoType,
                notificationDTO.Volume,
                crewMembers
            );
        }
        catch (Exception ex)
        {
            throw new Exception($"Error creating Vessel Visit Notification: {ex.Message}");
        }

        var cargoManifests = new List<CargoManifest>();
        if (notificationDTO.CargoManifests != null)
        {
            foreach (var cmDto in notificationDTO.CargoManifests)
            {
                var manifest = new CargoManifest(cmDto.ManifestType, new List<CargoManifestEntry>(), vesselVisitNotification);
                if (cmDto.Entries != null)
                {
                    foreach (var entryDto in cmDto.Entries)
                    {
                        Container container;
                        try
                        {
                            container = new Container(entryDto.ContainerNumber);
                        }
                        catch (Exception ex)
                        {
                            throw new Exception($"Invalid container in cargo manifest entry: {ex.Message}");
                        }
                        var storageArea = await _storageAreaRepository.GetStorageAreaByCodeAsync(entryDto.StorageAreaCode);
                        if (storageArea == null)
                        {
                            throw new Exception($"Storage area with code '{entryDto.StorageAreaCode}' not found.");
                        }
                        var manifestEntry = new CargoManifestEntry(container, entryDto.Row, entryDto.Bay, entryDto.Tier, storageArea, manifest);
                        manifest.Entries!.Add(manifestEntry);
                    }
                }
                cargoManifests.Add(manifest);
            }
            vesselVisitNotification.ChangeCargoManifests(cargoManifests);
        }
        var added = await _vesselVisitNotificationRepository.AddNotificationAsync(vesselVisitNotification);

        return VesselVisitNotificationDTO.ToDTO(added);
    }

    private List<CrewMember> ConvertCrewMemberDTOsToCrewMembers(List<CrewMemberDTO> crewMemberDTOs)
    {
        List<CrewMember> crewMembers = new List<CrewMember>();
        foreach (CrewMemberDTO crewMemberDTO in crewMemberDTOs)
        {
            if (!Enum.IsDefined(typeof(CrewRank), crewMemberDTO.Rank))
            {
                throw new Exception($"Invalid Rank: {crewMemberDTO.Rank}");
            }
            CrewMember crewMember = new CrewMember(crewMemberDTO.Name, crewMemberDTO.CitizenID, crewMemberDTO.Rank, crewMemberDTO.Nationality);
            crewMembers.Add(crewMember);
        }
        return crewMembers;
    }

    private async Task<string> GenerateUniqueVisitCodeAsync()
    {
        string portCode = "PA";
        int currentYear = DateTime.UtcNow.Year;
        var existingVisits = await _vesselVisitNotificationRepository.GetVisitsByYearAsync(currentYear);
        int nextSeq = 1;
        if (existingVisits != null && existingVisits.Any())
        {
            var seqNumbers = existingVisits
                .Select(v =>
                {
                    var parts = v.Code.Split('-');
                    if (parts.Length == 3 && int.TryParse(parts[2], out int seq))
                        return seq;
                    return 0;
                })
                .ToList();

            nextSeq = seqNumbers.Max() + 1;
        }

        string sequentialNumber = nextSeq.ToString("D6");
        string code = $"{currentYear}-{portCode}-{sequentialNumber}";
        Console.WriteLine($"Generated Vessel Visit Code: {code}");
        return code;
    }


    public async Task<bool> UpdateVesselVisitNotification(string visitCode, VesselVisitNotificationDTO notificationDTO, List<string> errorMessages)
    {
        VesselVisitNotification? existingNotification = await _vesselVisitNotificationRepository.GetVisitByCodeAsync(visitCode);
        if (existingNotification == null)
        {
            errorMessages.Add("Vessel Visit Notification not found.");
            return false;
        }
        if (visitCode != notificationDTO.Code)
        {
            errorMessages.Add("Visit code cannot be changed.");
            return false;
        }
        if (existingNotification.VisitStatus != VisitStatus.InProgress)
        {
            errorMessages.Add("Only visits with 'InProgress' status can be updated.");
            return false;
        }
        VesselRecord? vessel = await _vesselRecordRepository.GetVesselRecordByImoNumberAsync(notificationDTO.VesselIMO);
        if (vessel == null)
        {
            errorMessages.Add("Vessel Record not found.");
            return false;
        }
        Representative? representative = await _representativeRepository.GetRepresentativeByCitizenIdAsync(notificationDTO.RepresentativeCitizenID);
        if (representative == null)
        {
            errorMessages.Add("Representative not found.");
            return false;
        }
        try
        {
            List<CrewMember> crewMembers = new List<CrewMember>();
            if (notificationDTO.CrewMembers != null)
            {
                crewMembers = ConvertCrewMemberDTOsToCrewMembers(notificationDTO.CrewMembers);
            }
            existingNotification.ChangeVessel(vessel);
            existingNotification.ChangeRepresentative(representative);
            existingNotification.ChangeETAETD(notificationDTO.Eta, notificationDTO.Etd);
            var cargoManifests = new List<CargoManifest>();
            if (notificationDTO.CargoManifests != null)
            {
                foreach (var cmDto in notificationDTO.CargoManifests)
                {
                    try
                    {
                        var manifest = new CargoManifest(cmDto.ManifestType, new List<CargoManifestEntry>(), existingNotification);
                        if (cmDto.Entries != null)
                        {
                            foreach (var entryDto in cmDto.Entries)
                            {
                                Container container;
                                try
                                {
                                    container = new Container(entryDto.ContainerNumber);
                                }
                                catch (Exception ex)
                                {
                                    errorMessages.Add($"Invalid container in cargo manifest entry: {ex.Message}");
                                    return false;
                                }
                                var storageArea = await _storageAreaRepository.GetStorageAreaByCodeAsync(entryDto.StorageAreaCode);
                                if (storageArea == null)
                                {
                                    errorMessages.Add($"Storage area with code '{entryDto.StorageAreaCode}' not found.");
                                    return false;
                                }
                                var manifestEntry = new CargoManifestEntry(container, entryDto.Row, entryDto.Bay, entryDto.Tier, storageArea, manifest);
                                manifest.Entries!.Add(manifestEntry);
                            }
                        }
                        cargoManifests.Add(manifest);
                    }
                    catch (Exception ex)
                    {
                        errorMessages.Add($"Error creating cargo manifest: {ex.Message}");
                        return false;
                    }
                }
                existingNotification.ChangeCargoManifests(cargoManifests);
            }
            existingNotification.ChangeCargoType(notificationDTO.CargoType);
            existingNotification.ChangeVolume(notificationDTO.Volume);
            existingNotification.ChangeCrewMembers(crewMembers);
            existingNotification.ChangeVisitStatus(notificationDTO.VisitStatus);
            await _vesselVisitNotificationRepository.UpdateVisitAsync(existingNotification, errorMessages);
            return true;
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error updating Vessel Visit Notification: " + ex.Message);
            return false;
        }

    }
}