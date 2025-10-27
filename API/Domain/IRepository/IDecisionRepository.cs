namespace Domain.IRepository;

using Domain.Model;

public interface IDecisionRepository : IGenericRepository<Decision>
{
    Task<IEnumerable<Decision>> GetAllAsync();
    Task<Decision?> GetDecisionByIdAsync(long id);
    Task<Decision> AddDecisionAsync(Decision decision);
}