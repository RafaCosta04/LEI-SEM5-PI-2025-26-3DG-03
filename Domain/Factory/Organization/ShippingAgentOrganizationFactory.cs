namespace Domain.Factory;

using Domain.Model;

public class ShippingAgentFactory : IShippingAgentOrganizationFactory
{
    public ShippingAgentOrganization NewShippingAgentOrganization(string code, string legalName, string alternativeName, string address, string taxNumber)
    {
        return new ShippingAgentOrganization(code, legalName, alternativeName, address, taxNumber);
    }
}