namespace Domain.IRepository;

using Domain.Model;

public interface IStorageAreaRepository : IGenericRepository<StorageArea>
{
    Task<IEnumerable<StorageArea>> GetStorageAreasAsync();

    Task<StorageArea?> GetStorageAreaByCodeAsync(string name);

    Task<StorageArea?> GetStorageAreaByIdAsync(long id);

    Task<StorageArea?> GetStorageAreaByLocationAsync(string location);

    Task<StorageArea> AddStorageArea(StorageArea storageArea);

    Task<bool> Update(StorageArea storageArea, List<string> errorMessages);

    Task<bool> StorageAreaExists(long id);
}