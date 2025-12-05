namespace DataModel.Mapper;

using DataModel.Model;

using Domain.Model;
using Domain.Factory;
using System.Linq;
using DataModel.Repository;
using Microsoft.EntityFrameworkCore;



public class VesselVisitNotificationMapper
{
    private readonly IVesselVisitNotificationFactory _vesselVisitNotificationFactory;
    private readonly RepresentativeMapper _representativeMapper;
    private readonly DockMapper _dockMapper;

    private readonly VesselRecordMapper _vesselRecordMapper;
    private readonly StorageAreaMapper _storageAreaMapper;
    private readonly DockReassignmentLogMapper _dockReassignmentLogMapper;

    public VesselVisitNotificationMapper(IVesselVisitNotificationFactory vesselVisitNotificationFactory, RepresentativeMapper representativeMapper, DockMapper dockMapper, VesselRecordMapper vesselRecordMapper, StorageAreaMapper storageAreaMapper, DockReassignmentLogMapper dockReassignmentLogMapper)
    {
        _vesselVisitNotificationFactory = vesselVisitNotificationFactory;
        _representativeMapper = representativeMapper;
        _dockMapper = dockMapper;
        _vesselRecordMapper = vesselRecordMapper;
        _storageAreaMapper = storageAreaMapper;
        _dockReassignmentLogMapper = dockReassignmentLogMapper;
    }

    public VesselVisitNotification ToDomain(VesselVisitNotificationDataModel vesselVisitDM)
    {
        var cargoManifests = new List<CargoManifest>();

        var crewMembers = new List<CrewMember>();
        if (vesselVisitDM.CrewMembers != null)
        {
            foreach (var cm in vesselVisitDM.CrewMembers)
            {
                if (cm == null) continue;
                var rank = Enum.Parse<CrewRank>(cm.Rank!);
                crewMembers.Add(new CrewMember(cm.Name, cm.CitizenId, rank, cm.Nationality));
            }
        }

        List<DockReassignmentLog>? dockReassignmentLogs = null;
        if (vesselVisitDM.DockReassignmentLogs != null && vesselVisitDM.DockReassignmentLogs.Count > 0)
        {
            dockReassignmentLogs = vesselVisitDM.DockReassignmentLogs
                .Where(l => l != null)
                .Select(l => _dockReassignmentLogMapper.ToDomain(l))
                .ToList();
        }

        VesselVisitNotification vesselVisitDomain = _vesselVisitNotificationFactory.NewVesselVisitNotification(
            vesselVisitDM.Code!,
            _vesselRecordMapper.ToDomain(vesselVisitDM.Vessel),
            _representativeMapper.ToDomain(vesselVisitDM.Representative!),
            vesselVisitDM.ETA!,
            vesselVisitDM.ETD!,
            cargoManifests,
            Enum.Parse<CargoType>(vesselVisitDM.CargoType!),
            vesselVisitDM.Volume,
            crewMembers,
            vesselVisitDM.NumberOfCrewMembers,
            dockReassignmentLogs
        );
        vesselVisitDomain.Id = vesselVisitDM.Id;
        vesselVisitDomain.LastModifiedAt = vesselVisitDM.LastModifiedAt;
        vesselVisitDomain.VisitStatus = Enum.Parse<VisitStatus>(vesselVisitDM.VisitStatus!);

        if (vesselVisitDM.AssignedDock != null)
        {
            var dockDomain = _dockMapper.ToDomain(vesselVisitDM.AssignedDock);
            vesselVisitDomain.AssignDock(dockDomain);
        }

        if (vesselVisitDM.CargoManifests != null)
        {
            var manifests = new List<CargoManifest>();
            foreach (var cmDM in vesselVisitDM.CargoManifests)
            {
                if (cmDM == null) continue;
                var manifest = new CargoManifest(Enum.Parse<CargoManifestType>(cmDM.Type!), new List<CargoManifestEntry>(), vesselVisitDomain);
                if (cmDM.Entries != null)
                {
                    foreach (var entryDM in cmDM.Entries)
                    {
                        if (entryDM == null) continue;
                        var container = new Container(entryDM.Container);
                        var storageArea = _storageAreaMapper.ToDomain(entryDM.StorageArea);
                        var manifestEntry = new CargoManifestEntry(container, entryDM.Row, entryDM.Bay, entryDM.Tier, storageArea, manifest);
                        manifest.Entries!.Add(manifestEntry);
                    }
                }
                manifests.Add(manifest);
            }
            vesselVisitDomain.CargoManifests = manifests;
        }
        return vesselVisitDomain;
    }

    public IEnumerable<VesselVisitNotification> ToDomain(IEnumerable<VesselVisitNotificationDataModel> vesselVisitDataModels)
    {
        List<VesselVisitNotification> vesselVisitsDomain = new List<VesselVisitNotification>();

        foreach (VesselVisitNotificationDataModel vesselVisitDataModel in vesselVisitDataModels)
        {
            VesselVisitNotification vesselVisit = ToDomain(vesselVisitDataModel);
            vesselVisitsDomain.Add(vesselVisit);
        }
        return vesselVisitsDomain.AsEnumerable();
    }

    public VesselVisitNotificationDataModel ToDataModel(VesselVisitNotification vesselVisit)
    {
        VesselVisitNotificationDataModel dm = new VesselVisitNotificationDataModel(vesselVisit);
        dm.LastModifiedAt = vesselVisit.LastModifiedAt;
        return dm;
    }

    public async Task UpdateDataModelAsync(VesselVisitNotificationDataModel dm, VesselVisitNotification domain, DbContext context)
    {
        dm.Code = domain.Code;
        dm.VesselId = domain.Vessel.Id;
        dm.RepresentativeId = domain.Representative.Id;
        dm.ETA = domain.ETA;
        dm.ETD = domain.ETD;
        dm.CargoType = domain.CargoType.ToString();
        dm.Volume = domain.Volume;
        dm.VisitStatus = domain.VisitStatus.ToString();
        dm.LastModifiedAt = domain.LastModifiedAt;
        dm.NumberOfCrewMembers = domain.NumberOfCrewMembers;
        if (domain.AssignedDock != null)
        {
            var dockDM = await context.Set<DockDataModel>().FindAsync(domain.AssignedDock.Id);
            dm.AssignedDock = dockDM;
        }
        else
        {
            dm.AssignedDock = null;
        }
        dm.CrewMembers!.Clear();
        foreach (var cm in domain.CrewMembers)
        {
            var cmDM = new CrewMemberDataModel(cm);
            dm.CrewMembers.Add(cmDM);
        }
        dm.CargoManifests!.Clear();
        foreach (var manifest in domain.CargoManifests)
        {
            var cmDM = new CargoManifestDataModel(manifest);
            cmDM.VesselVisitNotification = dm;
            if (cmDM.Entries != null)
            {
                for (int i = 0; i < cmDM.Entries.Count; i++)
                {
                    var entryDM = cmDM.Entries[i];
                    StorageAreaDataModel? saDM = null;
                    if (entryDM.StorageAreaId != 0)
                    {
                        saDM = await context.Set<StorageAreaDataModel>().FindAsync(entryDM.StorageAreaId) as StorageAreaDataModel;
                    }
                    entryDM.StorageArea = saDM!;
                    entryDM.CargoManifest = cmDM;
                }
            }
            dm.CargoManifests.Add(cmDM);
        }
        dm.DockReassignmentLogs!.Clear();
        if (domain.DockReassignmentLogs != null)
        {
            foreach (var log in domain.DockReassignmentLogs)
            {
                var logDM = new DockReassignmentLogDataModel(log);
                // resolve dock references from DB so EF tracks them correctly
                if (log.OriginalDock != null)
                {
                    var originalDockDM = await context.Set<DockDataModel>().FindAsync(log.OriginalDock.Id) as DockDataModel;
                    logDM.OriginalDock = originalDockDM;
                }
                if (log.UpdatedDock != null)
                {
                    var updatedDockDM = await context.Set<DockDataModel>().FindAsync(log.UpdatedDock.Id) as DockDataModel;
                    logDM.UpdatedDock = updatedDockDM!;
                }
                // set back-reference
                logDM.VesselVisitNotification = dm;
                dm.DockReassignmentLogs.Add(logDM);
            }
        }
    }




}