namespace Application.Services;

using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Linq;
using System.Threading.Tasks;
using Domain.Model;
using Domain.IRepository;
using Application.DTO;
using Domain.Factory;
using Domain.Model.Resources;
using Microsoft.Extensions.Configuration;

public class SchedulingService
{

    private readonly IVesselVisitNotificationRepository _vesselVisitNotificationRepository;
    private readonly IStorageAreaRepository _storageAreaRepository;
    private readonly IStaffRepository _staff_repository;
    private readonly IPhysicalResourceRepository _physicalResourceRepository;
    private readonly IConfiguration _configuration;


    public SchedulingService(
        IVesselVisitNotificationRepository vesselVisitNotificationRepository,
        IStorageAreaRepository storageAreaRepository,
        IStaffRepository staffRepository,
        IPhysicalResourceRepository physicalResourceRepository,
        IConfiguration configuration)
    {
        _vesselVisitNotificationRepository = vesselVisitNotificationRepository;
        _storageAreaRepository = storageAreaRepository;
        _staff_repository = staffRepository;
        _physicalResourceRepository = physicalResourceRepository;
        _configuration = configuration;
    }

    public async Task<IEnumerable<SchedulingDTO>> GetSchedulingForTargetDay(DateTime targetDay)
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByTargetDay_StatusAsync(targetDay, VisitStatus.Approved);

        if (!notifications.Any()) return new List<SchedulingDTO>();

        Dock? dockAssigned = notifications.First().AssignedDock;
        string assignedDockName = dockAssigned?.Name ?? string.Empty;

        IEnumerable<PhysicalResource> physicalResources = await _physicalResourceRepository.SearchAsync(kind: PhysicalResourceKind.STSCrane, assignedDock: assignedDockName, status: ResourceStatus.Available);
        PhysicalResource? fastestCrane = (physicalResources ?? Enumerable.Empty<PhysicalResource>())
            .OrderByDescending(c => c.PhysicalResourceOperationalCapacity)
            .FirstOrDefault();

        IEnumerable<VesselVisitNotificationDTO> notificationDTOs = VesselVisitNotificationDTO.ToDTO(notifications);
        PhysicalResourceDTO fastestCraneDTO;
        if (fastestCrane != null)
        {
            fastestCraneDTO = PhysicalResourceDTO.ToDTO(fastestCrane);
        }
        else
        {
            fastestCraneDTO = new PhysicalResourceDTO
            {
                Id = null,
                Code = "N/A",
                Name = "NoCrane",
                Description = "No available crane",
                Kind = PhysicalResourceKind.STSCrane,
                SetupTimeMinutes = 0,
                OperationalCapacity = 1,
                AssignedArea = assignedDockName ?? string.Empty,
                QualificationCode = string.Empty,
                OperationalWindow = null,
                Status = ResourceStatus.Available
            };
        }

        DataScheduleDTO dataScheduleDTO = new DataScheduleDTO(notificationDTOs.ToList(), fastestCraneDTO);


        string endpoint = _configuration["Scheduling:Endpoint"] ?? "http://localhost:6000/api/scheduling/compute";
        try
        {
            using var client = new HttpClient();
            var json = JsonSerializer.Serialize(dataScheduleDTO, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync(endpoint, content);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception)
        {
        }

        var results = new List<SchedulingDTO>();
        foreach (var dto in notificationDTOs)
        {
            results.Add(new SchedulingDTO(dto.VesselIMO, dto.Eta, dto.Etd, new List<string>(), new List<string>()));
        }

        return results;
    }

}