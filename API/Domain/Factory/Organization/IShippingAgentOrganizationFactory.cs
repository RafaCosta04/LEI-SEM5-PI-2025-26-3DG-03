namespace Domain.Factory;

using Domain.Model;

public interface IShippingAgentOrganizationFactory
{
    ShippingAgentOrganization NewShippingAgentOrganization(string code, string legalName, string alternativeName, string address, string taxNumber);
}