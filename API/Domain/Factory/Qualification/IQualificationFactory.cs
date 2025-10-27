using ShippingManagement.Domain.Qualifications;

namespace Domain.Factory
{
    public interface IQualificationFactory
    {
        Qualification NewQualification(string code, string name, string? description = null);
    }
}
