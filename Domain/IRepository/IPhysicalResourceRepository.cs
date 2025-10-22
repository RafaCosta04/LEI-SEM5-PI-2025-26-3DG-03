namespace Domain.IRepository
{
    using Domain.Model.Resources;
    using Domain.Model;
    using System.Collections.Generic;

    public interface IPhysicalResourceRepository : IGenericRepository<PhysicalResource>
    {
        Task<IEnumerable<PhysicalResource>> GetAllPhysicalResourcesAsync();
        Task<PhysicalResource?> GetPhysicalResourceByIdAsync(long id);
        Task<PhysicalResource?> GetPhysicalResourceByCodeAsync(string code);
        Task<IEnumerable<PhysicalResource>> SearchAsync(string? code = null, string? name = null, string? description = null, PhysicalResourceKind? kind = null, ResourceStatus? status = null);
        Task<PhysicalResource> AddPhysicalResource(PhysicalResource resource);
        Task<PhysicalResource?> Update(PhysicalResource resource, List<string> errorMessages);
    }
}
