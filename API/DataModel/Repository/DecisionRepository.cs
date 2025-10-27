namespace DataModel.Repository;

using DataModel.Model;
using Domain.Model;
using DataModel.Mapper;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;

public class DecisionRepository : GenericRepository<Decision>, IDecisionRepository
{
    private readonly DecisionMapper _decisionMapper;
    public DecisionRepository(ShippingManagementContext context, DecisionMapper mapper) : base(context!)
    {
        _decisionMapper = mapper;
    }

    public async Task<IEnumerable<Decision>> GetAllAsync()
    {
        try
        {
            List<DecisionDataModel> dms = await _context.Set<DecisionDataModel>()
            .Include(d => d.VesselVisitNotification)
                .ThenInclude(vvn => vvn.Vessel)
                    .ThenInclude(v => v.VesselType)
            .Include(d => d.VesselVisitNotification)
                .ThenInclude(vvn => vvn.Representative)
                    .ThenInclude(r => r.Organization)
            .Include(d => d.VesselVisitNotification)
                .ThenInclude(vvn => vvn.CrewMembers)
            .Include(d => d.VesselVisitNotification)
                .ThenInclude(vvn => vvn.CargoManifests)
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
            .ToListAsync();

            List<Decision> decisions = new List<Decision>();
            foreach (DecisionDataModel dm in dms)
            {
                Decision decision = _decisionMapper.ToDomain(dm);
                decisions.Add(decision);
            }
            return decisions.AsEnumerable();
        }
        catch
        {
            throw;
        }
    }
    public async Task<Decision?> GetDecisionByIdAsync(long id)
    {
        try
        {
            DecisionDataModel? dm = await _context.Set<DecisionDataModel>()
            .Include(d => d.VesselVisitNotification)
                .ThenInclude(vvn => vvn.Vessel)
                    .ThenInclude(v => v.VesselType)
            .Include(d => d.VesselVisitNotification)
                .ThenInclude(vvn => vvn.Representative)
                    .ThenInclude(r => r.Organization)
            .Include(d => d.VesselVisitNotification)
                .ThenInclude(vvn => vvn.CrewMembers)
            .Include(d => d.VesselVisitNotification)
                .ThenInclude(vvn => vvn.CargoManifests)
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
            .SingleOrDefaultAsync(d => d.Id == id);
            if (dm == null)
            {
                return null;
            }
            Decision decision = _decisionMapper.ToDomain(dm);
            return decision;
        }
        catch
        {
            throw;
        }
    }
    public async Task<Decision> AddDecisionAsync(Decision decision)
    {
        try
        {
            DecisionDataModel dm = _decisionMapper.ToDataModel(decision);
            await _decisionMapper.UpdateDataModelAsync(dm, decision, _context);

            EntityEntry<DecisionDataModel> entry = _context.Set<DecisionDataModel>().Add(dm);
            await _context.SaveChangesAsync();

            Decision savedDm = _decisionMapper.ToDomain(entry.Entity);
            return savedDm;
        }
        catch
        {
            throw;
        }
    }
}