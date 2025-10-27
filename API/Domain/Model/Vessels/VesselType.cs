using System;
using System.Diagnostics.Contracts;

namespace Domain.Model;

public class VesselType
{
    public long Id { get; set; }

    public string? Name { get; private set; }

    public string? Description { get; private set; }

    public int Capacity { get; private set; }

    public int MaxRows { get; private set; }

    public int MaxBays { get; private set; }

    public int MaxTiers { get; private set; }

    public DateTime LastModifiedAt { get; set; }


    private VesselType() { }

    public VesselType(string name, string description, int capacity, int maxRows, int maxBays, int maxTiers)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Vessel type name cannot be null or empty.", nameof(name));
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Vessel type description cannot be null or empty.", nameof(description));
        }

        if (capacity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(capacity), "Capacity must be greater than zero.");
        }

        if (maxRows <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(maxRows), "Max rows must be greater than zero.");
        }

        if (maxBays <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(maxBays), "Max bays must be greater than zero.");
        }

        if (maxTiers <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(maxTiers), "Max tiers must be greater than zero.");
        }

        Name = name;
        Description = description;
        Capacity = capacity;
        MaxRows = maxRows;
        MaxBays = maxBays;
        MaxTiers = maxTiers;
        LastModifiedAt = DateTime.UtcNow;
    }


    public void ChangeMaxBays(int bays)
    {
        if (bays <= 0)
        {
            throw new ArgumentException("Max Bays should be higher than 0");
        }

        MaxBays = bays;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeMaxTiers(int tiers)
    {
        if (tiers <= 0)
        {
            throw new ArgumentException("Max Tiers should be higher than 0");
        }

        MaxTiers = tiers;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeMaxRows(int rows)
    {
        if (rows <= 0)
        {
            throw new ArgumentException("Max Rows should be higher than 0");
        }

        MaxRows = rows;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeCapacity(int capacity)
    {
        if (capacity <= 0)
        {
            throw new ArgumentException("Capacity should be higher than 0");
        }

        Capacity = capacity;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description name cannot be null or empty.", nameof(description));
        }

        Description = description;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Vessel Type Name cannot be null or empty.", nameof(name));
        }

        Name = name;
        LastModifiedAt = DateTime.UtcNow;
    }

}

