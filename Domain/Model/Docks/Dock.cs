using System.ComponentModel.DataAnnotations;

namespace Domain.Model;


public class Dock
{
    public long Id { get; set; }


    public string? Name { get; private set; }

    public string? Location { get; private set; }

    public int Length { get; private set; }

    public int Depth { get; private set; }

    public int MaxDraft { get; private set; }

    public List<VesselType>? VesselTypesAllowed { get; private set; }


    public DateTime LastModifiedAt { get; set; }

    private Dock() { }

    public Dock(string name, string location, int length, int depth, int maxDraft, List<VesselType> vesselTypesAllowed)
    {
        ValidateName(name);
        ValidateLocation(location);
        ValidateLength(length);
        ValidateDepth(depth);
        ValidateMaxDraft(maxDraft);
        ValidateVesselTypes(vesselTypesAllowed);

        Name = name;
        Location = location;
        VesselTypesAllowed = vesselTypesAllowed;
        Length = length;
        Depth = depth;
        MaxDraft = maxDraft;
    }

    public bool AddVesselType(VesselType vesselType)
    {
        if (vesselType == null) return false;
        if (VesselTypesAllowed!.Contains(vesselType)) return false;
        VesselTypesAllowed.Add(vesselType);
        return true;
    }

    public void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Dock name cannot be null or empty.", nameof(name));
        }
    }

    public void ValidateLocation(string location)
    {
        if (string.IsNullOrWhiteSpace(location))
        {
            throw new ArgumentException("Dock location cannot be null or empty.", nameof(location));
        }
    }

    public void ValidateLength(int length)
    {
        if (length <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(length), "Length must be greater than zero.");
        }
    }

    public void ValidateDepth(int depth)
    {
        if (depth <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(depth), "Depth must be greater than zero.");
        }
    }

    public void ValidateMaxDraft(int maxDraft)
    {
        if (maxDraft <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(maxDraft), "Max draft must be greater than zero.");
        }
    }

    public void ValidateVesselTypes(List<VesselType> vesselTypes)
    {
        if (vesselTypes == null)
        {
            throw new ArgumentNullException(nameof(vesselTypes), "Vessel types list cannot be null.");
        }
    }

    public void ChangeName(string name)
    {
        ValidateName(name);
        Name = name;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeLocation(string location)
    {
        ValidateLocation(location);
        Location = location;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeLength(int length)
    {
        ValidateLength(length);
        Length = length;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeDepth(int depth)
    {
        ValidateDepth(depth);
        Depth = depth;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeMaxDraft(int maxDraft)
    {
        ValidateMaxDraft(maxDraft);
        MaxDraft = maxDraft;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeVesselTypesAllowed(List<VesselType> vesselTypes)
    {
        ValidateVesselTypes(vesselTypes);
        VesselTypesAllowed = vesselTypes;
        LastModifiedAt = DateTime.UtcNow;
    }


}