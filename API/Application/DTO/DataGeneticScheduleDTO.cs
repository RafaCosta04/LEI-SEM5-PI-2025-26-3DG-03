namespace Application.DTO;


public class DataGeneticScheduleDTO
{
    public List<VesselVisitNotificationDTO> VesselVisitNotifications { get; set; }
    public int MaxCranes { get; set; }
    public int MedianOperationalCapacity { get; set; }

    public int FastestOperationalCapacity { get; set; }
    public int NumberOfGenerations { get; set; }
    public int PopulationSize { get; set; }

    public double CrossoverRate { get; set; }
    public double MutationRate { get; set; }

    public int DesiredTime { get; set; }

    public int StableGenerations { get; set; }

    public bool EnableMultiCrane {get; set; }

    public DataGeneticScheduleDTO(
        List<VesselVisitNotificationDTO> vesselVisitNotifications,
        int maxCranes,
        int medianOperationalCapacity,
        int numberOfGenerations,
        int populationSize,
        double crossoverRate,
        double mutationRate,
        int desiredTime,
        int stableGenerations,
        int fastestOperationalCapacity,
        bool enableMultiCrane
        )
    {
        VesselVisitNotifications = vesselVisitNotifications;
        MaxCranes = maxCranes;
        MedianOperationalCapacity = medianOperationalCapacity;
        NumberOfGenerations = numberOfGenerations;
        PopulationSize = populationSize;
        CrossoverRate = crossoverRate;
        MutationRate = mutationRate;
        DesiredTime = desiredTime;
        StableGenerations = stableGenerations;
        FastestOperationalCapacity = fastestOperationalCapacity;
        EnableMultiCrane = enableMultiCrane;
    }
}