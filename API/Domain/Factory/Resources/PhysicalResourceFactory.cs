using Domain.Model.Resources;
using Domain.Model;
using ShippingManagement.Domain.Qualifications;

namespace Domain.Factory
{
    public class PhysicalResourceFactory : IPhysicalResourceFactory
    {
        public PhysicalResource NewPhysicalResource(string code, string name, string description, PhysicalResourceKind kind, IEnumerable<Qualification> qualificationRequirements, int operationalCapacity, OperationalWindow operationalWindow, int? setupTimeMinutes = null)
        {
            return new PhysicalResource(code, name, description, kind, qualificationRequirements, operationalCapacity, operationalWindow, setupTimeMinutes);
        }
    }
}
