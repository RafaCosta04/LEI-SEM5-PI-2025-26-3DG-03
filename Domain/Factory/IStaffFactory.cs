namespace Domain.Factory;

using Domain.Model;
using ShippingManagement.Domain.Qualifications;

public interface IStaffFactory
{
    Staff NewStaff(string name, IEnumerable<Qualification> qualification, string email, string phone, OperationalWindow operationalWindow, ResourceStatus status);
}