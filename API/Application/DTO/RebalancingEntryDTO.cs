using System;
using System.Collections.Generic;

namespace Application.DTO;

public class VesselTimeDTO
{
    public string VesselName { get; set; }

    public string Arrival { get; set; }

    public string Departure { get; set; }

    public VesselTimeDTO(string vesselName, string arrival, string departure)
    {
        VesselName = vesselName;
        Arrival = arrival;
        Departure = departure;
    }
}

public class RebalancingEntryDTO
{
    public string DockName { get; set; }

    public int NumberOfCranes { get; set; }

    public List<VesselTimeDTO> VesselTimes { get; set; }

    public int OperationalCapacity { get; set; }

    public RebalancingEntryDTO(string dockName, int numberOfCranes, List<VesselTimeDTO> vesselTimes, int operationalCapacity)
    {
        DockName = dockName;
        NumberOfCranes = numberOfCranes;
        VesselTimes = vesselTimes ?? new List<VesselTimeDTO>();
        OperationalCapacity = operationalCapacity;
    }
}