using Domain.Model.Resources;
using Domain.Model;
using ShippingManagement.Domain.Qualifications;

namespace Domain.Factory
{
    public interface IPhysicalResourceFactory
    {
        PhysicalResource NewPhysicalResource(string code, string name, string description, PhysicalResourceKind kind, IEnumerable<Qualification> qualificationRequirements, int operationalCapacity, OperationalWindow operationalWindow, int? setupTimeMinutes = null);
    }
}
