namespace Domain.Factory;

using Domain.Model;


public class StorageAreaFactory : IStorageAreaFactory
{
    public StorageArea NewStorageArea(string code, string location, StorageAreaType type, int maxCapacity, int currentCapacity)
    {
        return new StorageArea(code, location, type, maxCapacity, currentCapacity);
    }
}