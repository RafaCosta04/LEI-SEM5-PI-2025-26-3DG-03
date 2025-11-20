namespace Domain.Factory;

using Domain.Model;

public class SystemUserFactory : ISystemUserFactory
{
    public SystemUser NewSystemUser(string code, string username, string email, SystemRole role)
    {
        return new SystemUser(code, username, email, role);
    }
}