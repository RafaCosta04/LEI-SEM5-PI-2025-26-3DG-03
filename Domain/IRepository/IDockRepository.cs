namespace Domain.IRepository;

using Domain.Model;

public interface IDockRepository : IGenericRepository<Dock>
{
    Task<IEnumerable<Dock>> GetDocksAsync();

    Task<Dock?> GetDockByNameAsync(string name);

    Task<Dock?> GetDockByIdAsync(long id);

    Task<Dock?> GetDockByLocationAsync(string location);

    Task<IEnumerable<Dock?>> GetDocksByVesselTypesAsync(IEnumerable<VesselType> vesselTypes);

    Task<Dock> AddDock(Dock dock);

    Task<Dock?> Update(Dock dock, List<string> errorMessages);

    Task<bool> DockExists(long id);

}