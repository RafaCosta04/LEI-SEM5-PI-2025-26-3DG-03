using ShippingManagement.Domain.Qualifications;

namespace Domain.Factory
{
    public class QualificationFactory : IQualificationFactory
    {
        public Qualification NewQualification(string code, string name, string? description = null)
        {
            return new Qualification(code, name, description ?? string.Empty);
        }
    }
}
