namespace Domain.Factory;

using Domain.Model;

public interface ISystemUserFactory
{
    SystemUser NewSystemUser(string code, string username, string email, SystemRole role);
}