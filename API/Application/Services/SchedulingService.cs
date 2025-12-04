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
    private readonly IDockRepository _dockRepository;

    private readonly IVesselRecordRepository _vesselRecordRepository;
    private readonly IPhysicalResourceRepository _physicalResourceRepository;
    private readonly IConfiguration _configuration;


    public SchedulingService(
        IVesselVisitNotificationRepository vesselVisitNotificationRepository,
        IStorageAreaRepository storageAreaRepository,
        IStaffRepository staffRepository,
        IPhysicalResourceRepository physicalResourceRepository,
        IConfiguration configuration,
        IVesselRecordRepository vesselRecordRepository,
        IDockRepository dockRepository
        )
    {
        _vesselVisitNotificationRepository = vesselVisitNotificationRepository;
        _storageAreaRepository = storageAreaRepository;
        _staff_repository = staffRepository;
        _physicalResourceRepository = physicalResourceRepository;
        _configuration = configuration;
        _vesselRecordRepository = vesselRecordRepository;
        _dockRepository = dockRepository;
    }

    public async Task<RebalancingDTO?> GetSchedulingWithRebalancingAlgorithm(DateTime targetDay, DateTime endDay, List<string> errorMessages)
    {
        if (endDay < targetDay)
        {
            var msg = "End day cannot be earlier than target day.";
            Console.WriteLine(msg);
            errorMessages.Add(msg);
            return null;
        }

        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByTargetDay_StatusAsync(targetDay, VisitStatus.Approved);
        if (!notifications.Any())
        {
            errorMessages.Add("No vessel visit notifications found for the target day.");
            return null;
        }

        var filteredNotifications = notifications
            .Where(n => n.ETA.Date >= targetDay.Date && n.ETA.Date <= endDay.Date)
            .ToList();

        if (!filteredNotifications.Any())
        {
            errorMessages.Add("No vessel visit notifications found between target day and end day.");
            return null;
        }
        
        var notificationDTOs = VesselVisitNotificationDTO.ToDTO(filteredNotifications).ToList();

        var docksFromDb = await _dockRepository.GetDocksAsync();
        var cranesByKindAll = await _physicalResourceRepository.GetPhysicalResourceByKindAsync(PhysicalResourceKind.STSCrane) ?? Enumerable.Empty<PhysicalResource>();

        var docksDto = new List<DockRebalancingDTO>();
        foreach (var dock in docksFromDb)
        {
            var dockName = dock.Name ?? string.Empty;
            var resourcesForDock = cranesByKindAll
                .Where(p => string.Equals((p.PhysicalResourceAssignedDockName ?? string.Empty).Trim(), dockName.Trim(), System.StringComparison.OrdinalIgnoreCase)
                            && p.Status == ResourceStatus.Available)
                .ToList();

            int median = GetMedianOperationalCapacity(resourcesForDock);
            docksDto.Add(new DockRebalancingDTO(dockName, median));
        }

        var dataRebalancing = new DataRebalancingDTO(notificationDTOs, docksDto);

        string configured = _configuration["Scheduling:Endpoint"] ?? "http://localhost:6000/";
        string baseEndpoint = configured;
        if (!baseEndpoint.EndsWith("/")) baseEndpoint += "/";
        string endpoint = baseEndpoint + "api/scheduling/rebalance";

        try
        {
            using var client = new HttpClient();
            client.Timeout = TimeSpan.FromMinutes(2);

            var json = JsonSerializer.Serialize(dataRebalancing, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync(endpoint, content);

            if (!response.IsSuccessStatusCode)
            {
                var errBody = await response.Content.ReadAsStringAsync();
                var msg = $"Rebalancing endpoint returned {(int)response.StatusCode} {response.ReasonPhrase}: {errBody}";
                Console.WriteLine(msg);
                errorMessages.Add(msg);
                return null;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            Console.WriteLine("Received rebalancing response from Prolog:");
            Console.WriteLine(responseJson);

            var doc = JsonDocument.Parse(responseJson);
            var rootEl = doc.RootElement;

            // New minimal shape: { status: "ok", assignments: [ { vessel, dock, actualDeparture, actualArrival }, ... ] }
            // Legacy shapes: { schedule: [...] } or { schedule: { schedule: [...], executionTime: N, totalDelay: M } }
            JsonElement scheduleArrayEl;
            double executionTime = 0.0;
            int totalDelay = 0;

            if (rootEl.TryGetProperty("assignments", out var assignmentsEl) && assignmentsEl.ValueKind == JsonValueKind.Array)
            {
                // Minimal assignments shape
                scheduleArrayEl = assignmentsEl;
            }
            else if (rootEl.TryGetProperty("schedule", out var scheduleRoot))
            {
                if (scheduleRoot.TryGetProperty("schedule", out var innerSchedule) && innerSchedule.ValueKind == JsonValueKind.Object)
                {
                    // shape (2)
                    scheduleArrayEl = innerSchedule.GetProperty("schedule");
                    if (innerSchedule.TryGetProperty("executionTime", out var execEl) && execEl.ValueKind == JsonValueKind.Number) executionTime = execEl.GetDouble();
                    if (innerSchedule.TryGetProperty("totalDelay", out var tdEl) && tdEl.ValueKind == JsonValueKind.Number) totalDelay = tdEl.GetInt32();
                }
                else if (scheduleRoot.TryGetProperty("schedule", out var directSchedule) && directSchedule.ValueKind == JsonValueKind.Array)
                {
                    // shape (1)
                    scheduleArrayEl = directSchedule;
                    if (scheduleRoot.TryGetProperty("executionTime", out var execEl) && execEl.ValueKind == JsonValueKind.Number) executionTime = execEl.GetDouble();
                    if (scheduleRoot.TryGetProperty("totalDelay", out var tdEl) && tdEl.ValueKind == JsonValueKind.Number) totalDelay = tdEl.GetInt32();
                }
                else if (scheduleRoot.ValueKind == JsonValueKind.Array)
                {
                    // schedule: [ ... ] directly
                    scheduleArrayEl = scheduleRoot;
                }
                else
                {
                    throw new InvalidOperationException("Invalid 'schedule' structure in rebalancing response");
                }
            }
            else
            {
                throw new InvalidOperationException("Invalid response from rebalancing endpoint: missing 'assignments' or 'schedule' property");
            }

            var scheduleArray = scheduleArrayEl.EnumerateArray();

            var rebalancedMap = new Dictionary<string, List<VesselTimeDTO>>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in scheduleArray)
            {
                string vesselIMO = item.GetProperty("vessel").GetString() ?? string.Empty;
                string dockName = item.GetProperty("dock").GetString() ?? string.Empty;

                // actualArrival
                string actualArrivalStr = string.Empty;
                if (item.TryGetProperty("actualArrival", out var aaEl))
                {
                    if (aaEl.ValueKind == JsonValueKind.Number)
                    {
                        if (TryExtractFirstNumber(aaEl, out double aah))
                        {
                            actualArrivalStr = targetDay.AddHours(aah).ToString("o");
                        }
                    }
                    else if (aaEl.ValueKind == JsonValueKind.String)
                    {
                        actualArrivalStr = aaEl.GetString() ?? string.Empty;
                    }
                    else actualArrivalStr = aaEl.ToString();
                }

                // actualDeparture
                string actualDepartureStr = string.Empty;
                if (item.TryGetProperty("actualDeparture", out var adEl))
                {
                    if (adEl.ValueKind == JsonValueKind.Number)
                    {
                        if (TryExtractFirstNumber(adEl, out double adh))
                        {
                            actualDepartureStr = targetDay.AddHours(adh).ToString("o");
                        }
                    }
                    else if (adEl.ValueKind == JsonValueKind.String)
                    {
                        actualDepartureStr = adEl.GetString() ?? string.Empty;
                    }
                    else actualDepartureStr = adEl.ToString();
                }

                string vesselName = await GetVesselNameByIMO(vesselIMO);
                var vt = new VesselTimeDTO(vesselName, actualArrivalStr, actualDepartureStr);
                if (!rebalancedMap.ContainsKey(dockName)) rebalancedMap[dockName] = new List<VesselTimeDTO>();
                rebalancedMap[dockName].Add(vt);
            }

            // Debug: print keys returned by Prolog
            Console.WriteLine("Rebalancing returned docks:");
            foreach (var k in rebalancedMap.Keys) Console.WriteLine($"  - {k}");

            // Build entries for each dock (initial and rebalanced)
            var initialEntries = new List<RebalancingEntryDTO>();
            var rebalancedEntries = new List<RebalancingEntryDTO>();
            foreach (var dockDto in docksDto)
            {
                string dockName = dockDto.Name ?? string.Empty;

                // count available cranes for this dock
                var resourcesForDock = cranesByKindAll
                    .Where(p => string.Equals((p.PhysicalResourceAssignedDockName ?? string.Empty).Trim(), dockName.Trim(), System.StringComparison.OrdinalIgnoreCase)
                                && p.Status == ResourceStatus.Available)
                    .ToList();
                int numberOfCranes = resourcesForDock.Count;

                // initial entries: from filteredNotifications (domain objects)
                var initialVesselTimes = new List<VesselTimeDTO>();
                var assignedNotifications = filteredNotifications
                    .Where(n => n.AssignedDock != null && string.Equals((n.AssignedDock.Name ?? string.Empty).Trim(), dockName.Trim(), System.StringComparison.OrdinalIgnoreCase))
                    .OrderBy(n => n.ETA)
                    .ToList();
                DateTime lastDeparture = DateTime.MinValue;
                foreach (var n in assignedNotifications)
                {
                    string vesselImo = n.Vessel?.IMONumber ?? string.Empty;
                    string vesselName = await GetVesselNameByIMO(vesselImo);

                    DateTime eta = n.ETA;
                    DateTime etd = n.ETD;

                    TimeSpan duration = etd > eta ? (etd - eta) : TimeSpan.FromHours(1);

                    DateTime adjustedArrival = eta;
                    if (lastDeparture != DateTime.MinValue && adjustedArrival < lastDeparture)
                    {
                        adjustedArrival = lastDeparture;
                    }

                    DateTime adjustedDeparture = adjustedArrival + duration;

                    lastDeparture = adjustedDeparture;

                    string arrival = adjustedArrival.ToString("o");
                    string departure = adjustedDeparture.ToString("o");
                    initialVesselTimes.Add(new VesselTimeDTO(vesselName, arrival, departure));
                }
                int operationalCapacity = dockDto.MedianOperationalCapacity;
                initialEntries.Add(new RebalancingEntryDTO(dockName, numberOfCranes, initialVesselTimes, operationalCapacity));

                // rebalanced entries: from rebalancedMap
                rebalancedMap.TryGetValue(dockName, out var reassignedTimes);
                var rebalancedList = reassignedTimes ?? new List<VesselTimeDTO>();
                rebalancedEntries.Add(new RebalancingEntryDTO(dockName, numberOfCranes, rebalancedList, operationalCapacity));
            }

            // If Prolog returned assignments for dock names that are not present in docksDto,
            // include them so the UI can show unrecognized/mismatched assignments for diagnosis.
            var knownDockNames = new HashSet<string>(docksDto.Select(d => d.Name ?? string.Empty), StringComparer.OrdinalIgnoreCase);
            foreach (var kv in rebalancedMap)
            {
                if (!knownDockNames.Contains(kv.Key))
                {
                    Console.WriteLine($"Adding unmatched rebalanced dock entry for: {kv.Key}");
                    // create an entry with 0 cranes and 0 operational capacity as fallback
                    rebalancedEntries.Add(new RebalancingEntryDTO(kv.Key, 0, kv.Value, 0));
                }
            }

            int medianOpCapOverall = GetMedianOperationalCapacity(cranesByKindAll);
            var rebalancingDto = new RebalancingDTO(initialEntries, rebalancedEntries);
            return rebalancingDto;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error calling rebalancing scheduling endpoint: {ex}");
            errorMessages.Add($"Rebalancing algorithm error: {ex.Message}");
            return null;
        }
    }
    public async Task<SchedulingDTO?> GetSchedulingWithGeneticAlgortithm(DateTime targetDay, int populationSize, int numberGenerations, double crossoverRate, double mutationRate, int desiredTime, int stableGenrations, bool enableMultiCrane, List<string> errorMessages)
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByTargetDay_StatusAsync(targetDay, VisitStatus.Approved);
        if (!notifications.Any())
        {
            errorMessages.Add("No vessel visit notifications found for the target day.");
            return null;
        }
        if (notifications.Count() < 2)
        {
            errorMessages.Add("Genetic algorithm requires at least 2 vessels. Please use Default or Heuristic algorithm for single vessel scheduling.");
            return null;
        }
        Dock? dockAssigned = notifications.First().AssignedDock;
        string assignedDockName = dockAssigned?.Name ?? string.Empty;

        var cranesByKind = await _physicalResourceRepository.GetPhysicalResourceByKindAsync(PhysicalResourceKind.STSCrane);
        string dockToMatch = (assignedDockName ?? string.Empty).Trim();

        IEnumerable<PhysicalResource> physicalResources = (cranesByKind ?? Enumerable.Empty<PhysicalResource>())
            .Where(p => string.Equals((p.PhysicalResourceAssignedDockName ?? string.Empty).Trim(), dockToMatch, System.StringComparison.OrdinalIgnoreCase)
                        && p.Status == ResourceStatus.Available);
        PhysicalResource? fastestCrane = (physicalResources ?? Enumerable.Empty<PhysicalResource>())
            .OrderByDescending(c => c.PhysicalResourceOperationalCapacity)
            .FirstOrDefault();
        int fastestCapacity = fastestCrane != null ? fastestCrane.PhysicalResourceOperationalCapacity : 0;
        int med = GetMedianOperationalCapacity(physicalResources!);
        Console.WriteLine($"Median operational capacity of available cranes: {med}");
        int availableCranes = (physicalResources ?? Enumerable.Empty<PhysicalResource>()).Count();
        DataGeneticScheduleDTO dataGeneticScheduleDTO = new DataGeneticScheduleDTO(
            VesselVisitNotificationDTO.ToDTO(notifications).ToList(),
            availableCranes,
            med,
            numberGenerations,
            populationSize,
            crossoverRate,
            mutationRate,
            desiredTime,
            stableGenrations,
            fastestCapacity,
            enableMultiCrane
        );

        string configured = _configuration["Scheduling:Endpoint"] ?? "http://localhost:6000/";
        string baseEndpoint = configured;
        if (!baseEndpoint.EndsWith("/")) baseEndpoint += "/";
        string endpoint = baseEndpoint + "api/scheduling/genetic";
        Console.WriteLine($"SchedulingService: calling Genetic Algorithm endpoint: {endpoint}");
        try
        {
            using var client = new HttpClient();
            client.Timeout = TimeSpan.FromMinutes(5); // Genetic algorithms may take longer

            var json = JsonSerializer.Serialize(
                dataGeneticScheduleDTO,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );

            Console.WriteLine($"Sending genetic algorithm request payload: {json}");

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync(endpoint, content);

            if (!response.IsSuccessStatusCode)
            {
                var errBody = await response.Content.ReadAsStringAsync();
                var msg = $"Genetic scheduling endpoint returned {(int)response.StatusCode} {response.ReasonPhrase}: {errBody}";
                Console.WriteLine(msg);
                errorMessages.Add(msg);
                return null;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            Console.WriteLine("Received genetic scheduling response from Prolog:");
            Console.WriteLine(responseJson);

            var doc = JsonDocument.Parse(responseJson);
            var scheduleRoot = doc.RootElement.GetProperty("schedule");
            var scheduleArray = scheduleRoot
                .GetProperty("schedule")
                .EnumerateArray();

            int totalDelay = scheduleRoot
                .GetProperty("totalDelay")
                .GetInt32();

            double executionTime = scheduleRoot
                .GetProperty("executionTime")
                .GetDouble();

            var messages = new List<string>();
            if (scheduleRoot.TryGetProperty("messages", out var messagesEl) && messagesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var me in messagesEl.EnumerateArray())
                {
                    if (me.ValueKind == JsonValueKind.String) messages.Add(me.GetString() ?? string.Empty);
                    else messages.Add(me.ToString());
                }
            }

            var entries = new List<SchedulingEntryDTO>();
            foreach (var item in scheduleArray)
            {
                string vesselIMO = item.GetProperty("vessel").GetString() ?? string.Empty;

                // parse start (may be number, string, or array) — extract first number, supporting nested arrays
                double startHours;
                var startEl = item.GetProperty("start");
                if (!TryExtractFirstNumber(startEl, out startHours))
                {
                    errorMessages.Add("Invalid 'start' element in genetic schedule entry");
                    return null;
                }

                // parse end (may be number, string, or array) — extract first number, supporting nested arrays
                double endHours;
                var endEl = item.GetProperty("end");
                if (!TryExtractFirstNumber(endEl, out endHours))
                {
                    errorMessages.Add("Invalid 'end' element in genetic schedule entry");
                    return null;
                }

                DateTime startTime = targetDay.AddHours(startHours);
                DateTime endTime = targetDay.AddHours(endHours);
                string vesselName = GetVesselNameByIMO(vesselIMO).Result;
                var assignedCranes = new List<string>();
                if (enableMultiCrane)
                {
                    // Multi-crane mode: assign all available cranes
                    foreach (var cr in physicalResources!)
                    {
                        assignedCranes.Add(cr.Name);
                    }
                }
                else
                {
                    // Single crane mode: assign only the fastest crane
                    if (fastestCrane != null)
                    {
                        assignedCranes.Add(fastestCrane.Name);
                    }
                }
                List<string> staffNames = await GetAvailableStaffNames();

                var schedulingEntryDTO = new SchedulingEntryDTO(vesselName, startTime, endTime, assignedCranes, staffNames);
                entries.Add(schedulingEntryDTO);
            }

            var schedulingDTO = new SchedulingDTO(entries, totalDelay, executionTime, messages);
            Console.WriteLine($"Genetic algorithm scheduling completed: {entries.Count} vessels, total delay: {totalDelay}, execution time: {executionTime}s");
            return schedulingDTO;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error calling genetic scheduling endpoint: {ex}");
            errorMessages.Add($"Genetic algorithm error: {ex.Message}");
            return null;
        }
    }

    private int GetMedianOperationalCapacity(IEnumerable<PhysicalResource> resources)
    {
        if (resources == null) return 0;
        var caps = resources.Select(r => r.PhysicalResourceOperationalCapacity).OrderBy(x => x).ToList();
        if (caps.Count == 0) return 0;
        int n = caps.Count;
        if (n % 2 == 1) return caps[n / 2];
        return (caps[(n / 2) - 1] + caps[n / 2]) / 2;
    }

    public async Task<SchedulingDTO?> GetSchedulingForTargetDay(DateTime targetDay, List<string> errorMessages, string algorithm = "default")
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByTargetDay_StatusAsync(targetDay, VisitStatus.Approved);
        if (!notifications.Any())
        {
            errorMessages.Add("No vessel visit notifications found for the target day.");
            return null;
        }
        Dock? dockAssigned = notifications.First().AssignedDock;
        string assignedDockName = dockAssigned?.Name ?? string.Empty;

        var cranesByKind = await _physicalResourceRepository.GetPhysicalResourceByKindAsync(PhysicalResourceKind.STSCrane);
        string dockToMatch = (assignedDockName ?? string.Empty).Trim();

        IEnumerable<PhysicalResource> physicalResources = (cranesByKind ?? Enumerable.Empty<PhysicalResource>())
            .Where(p => string.Equals((p.PhysicalResourceAssignedDockName ?? string.Empty).Trim(), dockToMatch, System.StringComparison.OrdinalIgnoreCase)
                        && p.Status == ResourceStatus.Available);
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
            errorMessages.Add("No available STS Crane found for the assigned dock.");
            return null;
        }
        int availableCranes = (physicalResources ?? Enumerable.Empty<PhysicalResource>()).Count();
        DataScheduleDTO dataScheduleDTO = new DataScheduleDTO(notificationDTOs.ToList(), fastestCraneDTO, availableCranes);
        string configured = _configuration["Scheduling:Endpoint"] ?? "http://localhost:6000/";
        string baseEndpoint = configured;
        if (!baseEndpoint.EndsWith("/")) baseEndpoint += "/";
        string path = "api/scheduling/compute";
        var algNorm = (algorithm ?? "default").Trim();
        if (string.IsNullOrEmpty(algNorm)) algNorm = "default";
        var algParam = algNorm.ToLowerInvariant();
        if (algParam != "default" && algParam != "improved")
        {
            var msgInvalid = $"Unsupported algorithm '{algParam}'. Supported values: 'default' or 'improved'.";
            Console.WriteLine(msgInvalid);
            errorMessages.Add(msgInvalid);
            return null;
        }
        string endpoint = baseEndpoint + path + "?algorithm=" + System.Uri.EscapeDataString(algParam);
        Console.WriteLine($"SchedulingService: requested algorithm='{algParam}', calling Prolog endpoint: {endpoint}");
        try
        {
            using var client = new HttpClient();
            var json = JsonSerializer.Serialize(
                dataScheduleDTO,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync(endpoint, content);
            if (!response.IsSuccessStatusCode)
            {
                var errBody = await response.Content.ReadAsStringAsync();
                var msg = $"Scheduling endpoint returned {(int)response.StatusCode} {response.ReasonPhrase}: {errBody}";
                Console.WriteLine(msg);
                errorMessages.Add(msg);
                return null;
            }
            var responseJson = await response.Content.ReadAsStringAsync();
            Console.WriteLine("Received scheduling response from Prolog:");
            Console.WriteLine(responseJson);
            var doc = JsonDocument.Parse(responseJson);
            var scheduleRoot = doc.RootElement.GetProperty("schedule");
            var scheduleArray = scheduleRoot
                .GetProperty("schedule")
                .EnumerateArray();

            int totalDelay = scheduleRoot
                .GetProperty("totalDelay")
                .GetInt32();
            double executionTime = scheduleRoot
                .GetProperty("executionTime")
                .GetDouble();

            // Extract messages if present
            var messages = new List<string>();
            if (scheduleRoot.TryGetProperty("messages", out var messagesEl) && messagesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var me in messagesEl.EnumerateArray())
                {
                    if (me.ValueKind == JsonValueKind.String) messages.Add(me.GetString() ?? string.Empty);
                    else messages.Add(me.ToString());
                }
            }
            var entries = new List<SchedulingEntryDTO>();
            foreach (var item in scheduleArray)
            {
                string vesselIMO = item.GetProperty("vessel").GetString() ?? string.Empty;

                double startHours;
                var startEl = item.GetProperty("start");
                if (!TryExtractFirstNumber(startEl, out startHours)) { errorMessages.Add("Invalid 'start' element in schedule entry"); return null; }

                double endHours;
                var endEl = item.GetProperty("end");
                if (!TryExtractFirstNumber(endEl, out endHours)) { errorMessages.Add("Invalid 'end' element in schedule entry"); return null; }
                DateTime startTime = targetDay.AddHours(startHours);
                DateTime endTime = targetDay.AddHours(endHours);
                string vesselName = GetVesselNameByIMO(vesselIMO).Result;
                var assignedCranes = new List<string> { fastestCrane.Name };
                List<string> staffNames = await GetAvailableStaffNames();

                var schedulingEntryDTO = new SchedulingEntryDTO(vesselName, startTime, endTime, assignedCranes, staffNames);
                entries.Add(schedulingEntryDTO);
            }
            var schedulingDTO = new SchedulingDTO(entries, totalDelay, executionTime, messages);
            return schedulingDTO;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex}");
            errorMessages.Add(ex.ToString());
            return null;
        }
    }
    private async Task<List<String>> GetAvailableStaffNames()
    {
        IEnumerable<Staff> availableStaff = await _staff_repository.GetStaffByQualificationCodeAsync("STSOP");
        return availableStaff.Select(s => s.Name).ToList();
    }

    private async Task<String> GetVesselNameByIMO(string imo)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByImoNumberAsync(imo);
        if (vesselRecord == null)
        {
            Console.WriteLine($"VesselRecord not found for IMO: {imo}");
            // If we don't have a VesselRecord for this IMO, return the IMO as a fallback label
            return imo ?? string.Empty;
        }
        return vesselRecord.VesselName ?? imo ?? string.Empty;
    }

    // Tries to extract the first numeric value (int or double) from a JsonElement.
    // Supports Number, String (parseable), Array (including nested arrays).
    // Returns the first number found, even if it's a decimal like 9.6
    private bool TryExtractFirstNumber(JsonElement el, out double value)
    {
        value = 0;
        try
        {
            if (el.ValueKind == JsonValueKind.Number)
            {
                value = el.GetDouble();
                return true;
            }
            if (el.ValueKind == JsonValueKind.String)
            {
                if (double.TryParse(el.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var v))
                {
                    value = v;
                    return true;
                }
                return false;
            }
            if (el.ValueKind == JsonValueKind.Array)
            {
                foreach (var e in el.EnumerateArray())
                {
                    if (e.ValueKind == JsonValueKind.Number)
                    {
                        value = e.GetDouble();
                        return true;
                    }
                    if (e.ValueKind == JsonValueKind.String && double.TryParse(e.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var v2))
                    {
                        value = v2;
                        return true;
                    }
                    if (e.ValueKind == JsonValueKind.Array)
                    {
                        if (TryExtractFirstNumber(e, out var nested))
                        {
                            value = nested;
                            return true;
                        }
                    }
                }
            }
        }
        catch
        {
            // ignore and return false below
        }
        return false;
    }

}