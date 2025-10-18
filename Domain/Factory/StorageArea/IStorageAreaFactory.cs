namespace Domain.Factory;

using Domain.Model;


public interface IStorageAreaFactory
{
    StorageArea NewStorageArea(string code, string location, StorageAreaType type, int maxCapacity, int currentCapacity);
}