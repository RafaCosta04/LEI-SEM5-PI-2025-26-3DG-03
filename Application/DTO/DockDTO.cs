namespace Application.DTO;

using Domain.Model;


public class DockDTO
{
    public string? Name { get; set; }
    public string? Location { get; set; }

    public int Length { get; private set; }

    public int Depth { get; private set; }

    public int MaxDraft { get; private set; }

    public List<VesselType>? VesselTypesAllowed { get; private set; }

    public DateTime LastModifiedAt { get; set; }


    public DockDTO() { }

    public DockDTO(string name, string location, int length, int depth, int maxDraft, List<VesselType> vesselTypesAllowed)
    {
        Name = name;
        Location = location;
        Length = length;
        Depth = depth;
        MaxDraft = maxDraft;
        VesselTypesAllowed = vesselTypesAllowed;
    }

    static public DockDTO ToDTO(Dock dock)
    {
        try
        {
            DockDTO dockDTO = new DockDTO(dock.Name!, dock.Location!, dock.Length, dock.Depth, dock.MaxDraft, dock.VesselTypesAllowed!);
            return dockDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to DockDTO: {ex.Message}");
        }
    }

    static public IEnumerable<DockDTO> ToDTO(IEnumerable<Dock> docks)
    {
        List<DockDTO> dockDTOs = new List<DockDTO>();
        foreach (Dock dock in docks)
        {
            DockDTO dockDTO = ToDTO(dock);
            dockDTOs.Add(dockDTO);
        }
        return dockDTOs;
    }

    static public Dock ToDomain(DockDTO dockDTO)
    {
        if (dockDTO.Name is null)
            throw new InvalidOperationException("Dock.Name cannot be null");

        if (dockDTO.Location is null)
            throw new InvalidOperationException("Dock.Location cannot be null");

        if (dockDTO.Length <= 0)
            throw new ArgumentOutOfRangeException(nameof(dockDTO.Length), "Length must be greater than zero");

        if (dockDTO.Depth <= 0)
            throw new ArgumentOutOfRangeException(nameof(dockDTO.Depth), "Depth must be greater than zero");

        if (dockDTO.MaxDraft <= 0)
            throw new ArgumentOutOfRangeException(nameof(dockDTO.MaxDraft), "MaxDraft must be greater than zero");

        if (dockDTO.VesselTypesAllowed == null || !dockDTO.VesselTypesAllowed.Any())
            throw new InvalidOperationException("Dock.VesselTypesAllowed cannot be null or empty");

        Dock dock = new Dock(dockDTO.Name, dockDTO.Location, dockDTO.Length, dockDTO.Depth, dockDTO.MaxDraft, dockDTO.VesselTypesAllowed);
        return dock;
    }


    static public Dock UpdateToDomain(Dock dock, DockDTO dockDTO)
    {
        dock.ChangeName(dockDTO.Name!);
        dock.ChangeLocation(dockDTO.Location!);
        dock.ChangeLength(dockDTO.Length);
        dock.ChangeDepth(dockDTO.Depth);
        dock.ChangeMaxDraft(dockDTO.MaxDraft);
        dock.ChangeVesselTypesAllowed(dockDTO.VesselTypesAllowed!);
        return dock;
    }
}