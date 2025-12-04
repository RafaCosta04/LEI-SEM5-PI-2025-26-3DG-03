namespace Application.DTO;

public class DockRebalancingDTO
{
    public string Name { get; set; } = string.Empty;
    public int MedianOperationalCapacity { get; set; }

    public DockRebalancingDTO() { }

    public DockRebalancingDTO(string name, int medianOperationalCapacity)
    {
        Name = name;
        MedianOperationalCapacity = medianOperationalCapacity;
    }
}
