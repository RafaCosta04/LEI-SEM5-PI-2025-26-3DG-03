namespace Application.DTO;

public class DockRebalancingDTO
{
    public string Name { get; set; } = string.Empty;
    public int OperationalCapacity { get; set; }

    public DockRebalancingDTO() { }

    public DockRebalancingDTO(string name, int operationalCapacity)
    {
        Name = name;
        OperationalCapacity = operationalCapacity;
    }
}
