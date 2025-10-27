using System.Collections.Generic;
using System.Threading.Tasks;
using ShippingManagement.Domain.Qualifications;

namespace Domain.IRepository
{
    public interface IQualificationRepository
    {
        Task<IEnumerable<Qualification>> GetQualificationsAsync();
        Task<Qualification?> GetQualificationByIdAsync(long id);
        Task<IEnumerable<Qualification>> GetQualificationsByNameAsync(string name);
        Task<Qualification?> GetQualificationByCodeAsync(string code);
        Task<IEnumerable<Qualification>> GetQualificationsByCodesAsync(IEnumerable<string> codes);
        Task<Qualification> AddQualificationAsync(Qualification qualification);
        Task<Qualification?> UpdateQualificationAsync(Qualification qualification, List<string> errorMessages);
        Task<bool> QualificationExists(long id);
        Task<bool> QualificationCodeExistsAsync(string code);
        Task<bool> QualificationNameExistsAsync(string name);
    }
}
