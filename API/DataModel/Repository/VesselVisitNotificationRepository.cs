namespace DataModel.Repository;

using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Domain.Model;
using System.Collections.Generic;

public class VesselVisitNotificationRepository : GenericRepository<VesselVisitNotification>, IVesselVisitNotificationRepository
{
    private readonly VesselVisitNotificationMapper _vesselVisitNotificationMapper;

    public VesselVisitNotificationRepository(ShippingManagementContext context, VesselVisitNotificationMapper mapper) : base(context!)
    {
        _vesselVisitNotificationMapper = mapper;
    }

    public async Task<IEnumerable<VesselVisitNotification>> GetAllVisitsAsync()
    {
        try
        {
            IEnumerable<VesselVisitNotificationDataModel> vesselVisitDMs = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .ToListAsync();
            IEnumerable<VesselVisitNotification> vesselVisits = vesselVisitDMs.Select(vvn => _vesselVisitNotificationMapper.ToDomain(vvn));
            return vesselVisits;
        }
        catch
        {
            throw;
        }
    }

    public async Task<VesselVisitNotification?> GetVisitByCodeAsync(string visitCode)
    {
        try
        {
            VesselVisitNotificationDataModel? vesselVisitDM = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .FirstOrDefaultAsync(vvn => vvn.Code == visitCode);

            if (vesselVisitDM == null)
            {
                return null;
            }

            VesselVisitNotification vesselVisit = _vesselVisitNotificationMapper.ToDomain(vesselVisitDM);
            return vesselVisit;
        }
        catch
        {
            throw;
        }
    }

    public async Task<VesselVisitNotification?> GetVisitByIdAsync(long id)
    {
        try
        {
            VesselVisitNotificationDataModel? vesselVisitDM = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .FirstOrDefaultAsync(vvn => vvn.Id == id);

            if (vesselVisitDM == null)
            {
                return null;
            }

            VesselVisitNotification vesselVisit = _vesselVisitNotificationMapper.ToDomain(vesselVisitDM);
            return vesselVisit;
        }
        catch
        {
            throw;
        }
    }

    public async Task<IEnumerable<VesselVisitNotification>> GetVisitsByOrgAsync(string orgCode)
    {
        try
        {
            IEnumerable<VesselVisitNotificationDataModel> vesselVisitDMs = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .Where(vvn => vvn.Representative.Organization!.Code == orgCode)
                .ToListAsync();

            IEnumerable<VesselVisitNotification> vesselVisits = vesselVisitDMs.Select(vvn => _vesselVisitNotificationMapper.ToDomain(vvn));
            return vesselVisits;
        }
        catch
        {
            throw;
        }
    }

    public async Task<IEnumerable<VesselVisitNotification>> GetVisitsByVesselIMO_OrgAsync(string imoNumber, string orgCode)
    {
        try
        {
            IEnumerable<VesselVisitNotificationDataModel> vesselVisitDMs = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .Where(vvn => vvn.Vessel!.IMONumber == imoNumber && vvn.Representative!.Organization!.Code == orgCode)
                .ToListAsync();

            IEnumerable<VesselVisitNotification> vesselVisits = vesselVisitDMs.Select(vvn => _vesselVisitNotificationMapper.ToDomain(vvn));
            return vesselVisits;
        }
        catch
        {
            throw;
        }
    }

    public async Task<IEnumerable<VesselVisitNotification>> GetVisitsByVesselIMOAsync(string imoNumber)
    {
        try
        {
            IEnumerable<VesselVisitNotificationDataModel> vesselVisitDMs = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .Where(vvn => vvn.Vessel!.IMONumber == imoNumber)
                .ToListAsync();

            IEnumerable<VesselVisitNotification> vesselVisits = vesselVisitDMs.Select(vvn => _vesselVisitNotificationMapper.ToDomain(vvn));
            return vesselVisits;
        }
        catch
        {
            throw;
        }
    }

    public async Task<IEnumerable<VesselVisitNotification>> GetVisitsByYearAsync(int year)
    {
        try
        {
            IEnumerable<VesselVisitNotificationDataModel> vesselVisitDMs = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .Where(vvn => vvn.ETA.Year == year)
                .ToListAsync();

            IEnumerable<VesselVisitNotification> vesselVisits = vesselVisitDMs.Select(vvn => _vesselVisitNotificationMapper.ToDomain(vvn));
            return vesselVisits;
        }
        catch
        {
            throw;
        }
    }

    public async Task<IEnumerable<VesselVisitNotification>> GetVisitsByDateRange_OrgAsync(DateTime startDate, DateTime endDate, string orgCode)
    {
        try
        {
            IEnumerable<VesselVisitNotificationDataModel> vesselVisitDMs = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .Where(vvn => vvn.ETA >= startDate && vvn.ETA <= endDate && vvn.Representative!.Organization!.Code == orgCode)
                .ToListAsync();

            IEnumerable<VesselVisitNotification> vesselVisits = vesselVisitDMs.Select(vvn => _vesselVisitNotificationMapper.ToDomain(vvn));
            return vesselVisits;
        }
        catch
        {
            throw;
        }
    }

    public async Task<IEnumerable<VesselVisitNotification>> GetVisitsByTargetDay_StatusAsync(DateTime targetDay, VisitStatus status)
    {
        DateTime endDate = targetDay.Date.AddDays(1);
        try
        {
            IEnumerable<VesselVisitNotificationDataModel> vesselVisitDMs = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .Where(vvn => vvn.ETA >= targetDay && vvn.ETA <= endDate && vvn.VisitStatus == status.ToString())
                .ToListAsync();

            IEnumerable<VesselVisitNotification> vesselVisits = vesselVisitDMs.Select(vvn => _vesselVisitNotificationMapper.ToDomain(vvn));
            return vesselVisits;
        }
        catch
        {
            throw;
        }
    }

    public async Task<IEnumerable<VesselVisitNotification>> GetVisitsByRepresentativeAsync(string citizenId)
    {
        try
        {
            var vesselVisitDataModels = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .Where(vvn => vvn.Representative!.CitizenId == citizenId)
                .ToListAsync();

            var vesselVisits = vesselVisitDataModels.Select(vvn => _vesselVisitNotificationMapper.ToDomain(vvn));
            return vesselVisits;
        }
        catch
        {
            throw;
        }
    }


    public async Task<IEnumerable<VesselVisitNotification>> GetVisitsByStatus_OrgAsync(VisitStatus status, string orgCode)
    {
        try
        {
            IEnumerable<VesselVisitNotificationDataModel> vesselVisitDMs = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)!
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)!
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .Where(vvn => vvn.VisitStatus == status.ToString() && vvn.Representative!.Organization!.Code == orgCode)
                .ToListAsync();

            IEnumerable<VesselVisitNotification> vesselVisits = vesselVisitDMs.Select(vvn => _vesselVisitNotificationMapper.ToDomain(vvn));
            return vesselVisits;
        }
        catch
        {
            throw;
        }
    }





    public async Task<VesselVisitNotification> AddNotificationAsync(VesselVisitNotification notification)
    {
        try
        {
            VesselVisitNotificationDataModel dm = _vesselVisitNotificationMapper.ToDataModel(notification);
            await _vesselVisitNotificationMapper.UpdateDataModelAsync(dm, notification, _context);

            EntityEntry<VesselVisitNotificationDataModel> addedEntry = _context.Set<VesselVisitNotificationDataModel>().Add(dm);

            await _context.SaveChangesAsync();

            VesselVisitNotification savedDm = _vesselVisitNotificationMapper.ToDomain(addedEntry.Entity);
            return savedDm;
        }
        catch
        {
            throw;
        }
    }
    public async Task<bool> UpdateVisitAsync(VesselVisitNotification notification, List<string> errorMessages)
    {
        try
        {
            VesselVisitNotificationDataModel? dm = await _context.Set<VesselVisitNotificationDataModel>()
                .Include(vvn => vvn.Vessel)
                    .ThenInclude(v => v.VesselType)
                .Include(vvn => vvn.Representative)
                    .ThenInclude(r => r.Organization)
                .Include(vvn => vvn.CargoManifests)!
                    .ThenInclude(cm => cm.Entries)
                        .ThenInclude(e => e.StorageArea)
                .Include(vvn => vvn.CrewMembers)!
                .FirstOrDefaultAsync(vvn => vvn.Id == notification.Id);

            if (dm == null)
            {
                errorMessages.Add($"VesselVisitNotification with Id {notification.Id} not found.");
                return false;
            }

            await _vesselVisitNotificationMapper.UpdateDataModelAsync(dm, notification, _context);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            errorMessages.Add($"An error occurred while updating the VesselVisitNotification: {ex.Message}");
            return false;
        }
    }
}