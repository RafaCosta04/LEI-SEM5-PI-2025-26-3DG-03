namespace Domain.IRepository;

using Domain.Model;


public interface IVesselVisitNotificationRepository : IGenericRepository<VesselVisitNotification>
{
    Task<IEnumerable<VesselVisitNotification>> GetAllVisitsAsync();

    Task<VesselVisitNotification?> GetVisitByCodeAsync(string visitCode);

    Task<VesselVisitNotification?> GetVisitByIdAsync(long id);

    Task<IEnumerable<VesselVisitNotification>> GetVisitsByOrgAsync(string orgCode);

    Task<IEnumerable<VesselVisitNotification>> GetVisitsByVesselIMO_OrgAsync(string imoNumber, string orgCode);

    Task<IEnumerable<VesselVisitNotification>> GetVisitsByVesselIMOAsync(string imoNumber);

    Task<IEnumerable<VesselVisitNotification>> GetVisitsByYearAsync(int year);

    Task<IEnumerable<VesselVisitNotification>> GetVisitsByDateRange_OrgAsync(DateTime startDate, DateTime endDate, string orgCode);

    Task<IEnumerable<VesselVisitNotification>> GetVisitsByRepresentativeAsync(string citizenId);

    Task<IEnumerable<VesselVisitNotification>> GetVisitsByStatus_OrgAsync(VisitStatus status, string orgCode);

    Task<VesselVisitNotification> AddNotificationAsync(VesselVisitNotification notification);

    Task<bool> UpdateVisitAsync(VesselVisitNotification notification, List<string> errorMessages);
    
}