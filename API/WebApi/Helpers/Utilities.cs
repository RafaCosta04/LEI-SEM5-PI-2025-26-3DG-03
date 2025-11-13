using DataModel.Repository;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Text;
using System.Collections.Generic;
namespace WebApi.Helpers;

using DataModel.Model;
using Domain.Model;
using Domain.Model.Resources;
using ShippingManagement.Domain.Qualifications;

public static class Utilities
{
    private static bool _isInitialized = false;
    private static readonly object _lock = new object();

    public static void InitializeDatabase(WebApplication app)
    {
        lock (_lock)
        {
            if (_isInitialized) return;

            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();


                db.Database.EnsureCreated();


                if (db.Qualifications.Any())
                {
                    _isInitialized = true;
                    return;
                }

                // Seeding
                db.VesselTypes.AddRange(GetSeedingVesselTypesDataModel());
                db.SaveChanges();

                var vesselTypes = db.VesselTypes.ToList();
                db.Docks.AddRange(GetSeedingDocksDataModel(vesselTypes));
                db.SaveChanges();

                var docks = db.Docks.ToList();
                db.StorageAreas.AddRange(GetSeedingStorageAreasDataModel(docks));
                db.SaveChanges();

                var orgsAndReps = GetSeedingOrganizationDataModelsAndRepresentatives();
                foreach (var (orgDM, repsDM) in orgsAndReps)
                {
                    db.ShippingAgentOrganizations.Add(orgDM);
                    foreach (var repDM in repsDM)
                    {
                        db.Representatives.Add(repDM);
                    }
                }
                db.SaveChanges();

                db.VesselRecords.AddRange(GetSeedingVesselRecordsDataModel(vesselTypes));
                db.SaveChanges();

                var vesselRecords = db.VesselRecords.ToList();
                var representatives = db.Representatives.ToList();
                var storageAreas = db.StorageAreas.ToList();
                db.VesselVisitNotifications.AddRange(GetSeedingVesselVisitNotificationsDataModel(vesselRecords, representatives, storageAreas, docks));
                db.SaveChanges();

                db.Qualifications.AddRange(GetSeedingQualificationsDataModel());
                db.SaveChanges();

                db.Staffs.AddRange(GetSeedingStaffDataModel(db.Qualifications.ToList()));
                db.SaveChanges();

                var qualifications = db.Qualifications.ToList();
                db.PhysicalResources.AddRange(GetSeedingPhysicalResourcesDataModel(qualifications));
                db.SaveChanges();

                _isInitialized = true;
            }
        }
    }

    public static List<VesselTypeDataModel> GetSeedingVesselTypesDataModel()
    {
        return new List<VesselTypeDataModel>()
        {
            new VesselTypeDataModel(new VesselType("Large Container Ships", "Large container ship", 300, 10,10,10)),
            new VesselTypeDataModel(new VesselType("Small Container Ships", "Small container ship", 100, 10,5,5)),
            new VesselTypeDataModel(new VesselType("General Cargo", "General cargo ship", 200, 10,10,100))
        };
    }

    public static List<DockDataModel> GetSeedingDocksDataModel(List<VesselTypeDataModel> vesselTypes)
    {
        return new List<DockDataModel>()
        {
            new DockDataModel
            {
                Name = "Dock A",
                Location = "Port 1",
                Length = 500,
                Depth = 30,
                MaxDraft = 15,
                VesselTypesAllowed = new List<VesselTypeDataModel> { vesselTypes[0], vesselTypes[1] },
                LastModifiedAt = DateTime.UtcNow
            },
            new DockDataModel
            {
                Name = "Dock B",
                Location = "Port 2",
                Length = 300,
                Depth = 20,
                MaxDraft = 10,
                VesselTypesAllowed = new List<VesselTypeDataModel> { vesselTypes[0], vesselTypes[1], vesselTypes[2] },
                LastModifiedAt = DateTime.UtcNow
            },
        };
    }

    public static List<VesselRecordDataModel> GetSeedingVesselRecordsDataModel(List<VesselTypeDataModel> vesselTypes)
    {
        return new List<VesselRecordDataModel>()
        {
            new VesselRecordDataModel
            {
                IMONumber = "9074729",
                VesselName = "Vessel One",
                VesselType = vesselTypes[0],
                Operator = "JOAO Shipping",
                LastModifiedAt = DateTime.UtcNow
            },
            new VesselRecordDataModel
            {
                IMONumber = "9235672",
                VesselName = "Vessel Two",
                VesselType = vesselTypes[1],
                Operator = "MARIA Shipping",
                LastModifiedAt = DateTime.UtcNow
            },
            new VesselRecordDataModel
            {
                IMONumber = "9074730",
                VesselName = "Vessel Three",
                VesselType = vesselTypes[1],
                Operator = "PEDRO Shipping",
                LastModifiedAt = DateTime.UtcNow
            },
            new VesselRecordDataModel
            {
                IMONumber = "9319466",
                VesselName = "Vessel Four",
                VesselType = vesselTypes[0],
                Operator = "ANA Shipping",
                LastModifiedAt = DateTime.UtcNow
            },
            new VesselRecordDataModel
            {
                IMONumber = "7601255",
                VesselName = "Vessel Five",
                VesselType = vesselTypes[0],
                Operator = "LUIS Shipping",
                LastModifiedAt = DateTime.UtcNow
            }
        };
    }

    public static List<StorageAreaDataModel> GetSeedingStorageAreasDataModel(List<DockDataModel> docks)
    {
        DockDataModel? find(string name) => docks.FirstOrDefault(d => string.Equals(d.Name, name, StringComparison.OrdinalIgnoreCase));

        var storageAreas = new List<StorageAreaDataModel>();

        var wh1 = new StorageAreaDataModel
        {
            Code = "WH001",
            Location = "Warehouse 1",
            Type = "Warehouse",
            MaxCapacity = 1000,
            CurrentCapacity = 200,
            LastModifiedAt = DateTime.UtcNow,
            StorageAreaDocks = new List<StorageAreaDockDataModel>()
        };
        var dockA = find("Dock A");
        var dockB = find("Dock B");
        if (dockA != null) wh1.StorageAreaDocks.Add(new StorageAreaDockDataModel { Dock = dockA, Distance = 10 });
        if (dockB != null) wh1.StorageAreaDocks.Add(new StorageAreaDockDataModel { Dock = dockB, Distance = 40 });

        var wh2 = new StorageAreaDataModel
        {
            Code = "WH002",
            Location = "Warehouse 2",
            Type = "Warehouse",
            MaxCapacity = 2000,
            CurrentCapacity = 500,
            LastModifiedAt = DateTime.UtcNow,
            StorageAreaDocks = new List<StorageAreaDockDataModel>()
        };
        if (dockA != null) wh2.StorageAreaDocks.Add(new StorageAreaDockDataModel { Dock = dockA, Distance = 20 });
        if (dockB != null) wh2.StorageAreaDocks.Add(new StorageAreaDockDataModel { Dock = dockB, Distance = 30 });

        storageAreas.Add(wh1);
        storageAreas.Add(wh2);

        return storageAreas;
    }

    public static List<StaffDataModel> GetSeedingStaffDataModel(List<QualificationDataModel> qualifications)
    {
        var qual1 = qualifications.FirstOrDefault(q => q.Code == "STSOP");
        var qual2 = qualifications.FirstOrDefault(q => q.Code == "MBLOP");
        if (qual1 == null || qual2 == null)
            throw new InvalidOperationException("Required qualifications not found in seeding data.");


        return new List<StaffDataModel>()
        {
            new StaffDataModel
            {
                Name = "Staff One",
                Email = "staff1@gmail.com",
                Phone = "987654321",
                Qualification = new List<QualificationDataModel> { qual1, qual2 },
                OperationalWindow = new OperationalWindow(DayOfWeek.Monday, DayOfWeek.Friday, new TimeSpan(9,0,0), new TimeSpan(17,0,0)),
                Status = ResourceStatus.Available,
                LastModifiedAt = DateTime.UtcNow
            },
            new StaffDataModel
            {
                Name = "Staff Two",
                Email = "staff2@gmail.com",
                Phone = "987654322",
                Qualification = new List<QualificationDataModel> { qual1 },
                OperationalWindow = new OperationalWindow(DayOfWeek.Tuesday, DayOfWeek.Saturday, new TimeSpan(10,0,0), new TimeSpan(18,0,0)),
                Status = ResourceStatus.Unavailable,
                LastModifiedAt = DateTime.UtcNow
            }
        };
    }
    public static List<VesselVisitNotificationDataModel> GetSeedingVesselVisitNotificationsDataModel(List<VesselRecordDataModel> vesselRecords, List<RepresentativeDataModel> representatives, List<StorageAreaDataModel> storageAreas, List<DockDataModel> docks)
    {
        var now = DateTime.UtcNow;
        var notifications = new List<VesselVisitNotificationDataModel>();
        var eta0 = now.AddDays(1);
        var etd0 = eta0.AddDays(1);
        var n1 = new VesselVisitNotificationDataModel
        {
            Code = $"{now.Year}-PA-{1.ToString("D6")}",
            Vessel = vesselRecords[0],
            VesselId = vesselRecords[0].Id,
            Representative = representatives[0],
            RepresentativeId = representatives[0].Id,
            ETA = eta0,
            ETD = etd0,
            CargoManifests = new List<CargoManifestDataModel>(),
            CargoType = CargoType.Container.ToString(),
            Volume = 100.0,
            CrewMembers = new List<CrewMemberDataModel>
            {
                new CrewMemberDataModel { Name = "Captain 1", CitizenId = "CPT001", Rank = CrewRank.Captain.ToString(), Nationality = "PT" }
            },
            AssignedDock = null,
            VisitStatus = VisitStatus.InProgress.ToString(),
            LastModifiedAt = now,
            NumberOfCrewMembers = 10
        };

        var cm1 = new CargoManifestDataModel
        {
            Type = CargoManifestType.Loading.ToString(),
            Entries = new List<CargoManifestEntryDataModel>()
        };

        cm1.Entries.Add(new CargoManifestEntryDataModel { Container = "ABCU1112222", Row = 1, Bay = 1, Tier = 1, StorageArea = storageAreas[0], StorageAreaId = storageAreas[0].Id });
        cm1.Entries.Add(new CargoManifestEntryDataModel { Container = "ABCU2223334", Row = 2, Bay = 1, Tier = 1, StorageArea = storageAreas[0], StorageAreaId = storageAreas[0].Id });
        n1.CargoManifests.Add(cm1);

        var eta1 = now.AddDays(4);
        var etd1 = eta1.AddDays(1);
        var n2 = new VesselVisitNotificationDataModel
        {
            Code = $"{now.Year}-PA-{2.ToString("D6")}",
            Vessel = vesselRecords[0],
            VesselId = vesselRecords[0].Id,
            Representative = representatives[1],
            RepresentativeId = representatives[1].Id,
            ETA = eta1,
            ETD = etd1,
            CargoManifests = new List<CargoManifestDataModel>(),
            CargoType = CargoType.Container.ToString(),
            Volume = 200.0,
            CrewMembers = new List<CrewMemberDataModel>
            {
                new CrewMemberDataModel { Name = "Captain 2", CitizenId = "CPT002", Rank = CrewRank.Captain.ToString(), Nationality = "PT" }
            },
            AssignedDock = null,
            VisitStatus = VisitStatus.InProgress.ToString(),
            LastModifiedAt = now,
            NumberOfCrewMembers = 10
        };


        var cm2 = new CargoManifestDataModel
        {
            Type = CargoManifestType.Unloading.ToString(),
            Entries = new List<CargoManifestEntryDataModel>()
        };

        cm2.Entries.Add(new CargoManifestEntryDataModel { Container = "ABCU3332221", Row = 1, Bay = 2, Tier = 1, StorageArea = storageAreas[0], StorageAreaId = storageAreas[0].Id });
        n2.CargoManifests.Add(cm2);

        var eta2 = now.AddDays(7);
        var etd2 = eta2.AddDays(1);
        var n3 = new VesselVisitNotificationDataModel
        {
            Code = $"{now.Year}-PA-{3.ToString("D6")}",
            Vessel = vesselRecords[0],
            VesselId = vesselRecords[0].Id,
            Representative = representatives[2],
            RepresentativeId = representatives[2].Id,
            ETA = eta2,
            ETD = etd2,
            CargoManifests = new List<CargoManifestDataModel>(),
            CargoType = CargoType.Hazardous.ToString(),
            Volume = 300.0,
            CrewMembers = new List<CrewMemberDataModel>
            {
                new CrewMemberDataModel { Name = "Captain 3", CitizenId = "CPT003", Rank = CrewRank.Captain.ToString(), Nationality = "PT" },
                new CrewMemberDataModel { Name = "Safety Officer Paulo", CitizenId = "FO001", Rank = CrewRank.SafetyOfficer.ToString(), Nationality = "FR" }
            },
            AssignedDock = null,
            VisitStatus = VisitStatus.InProgress.ToString(),
            LastModifiedAt = now,
            NumberOfCrewMembers = 10
        };

        if (storageAreas.Count > 0)
        {
            var saMain = storageAreas[0];
            var cm3a = new CargoManifestDataModel { Type = CargoManifestType.Loading.ToString(), Entries = new List<CargoManifestEntryDataModel>() };
            cm3a.Entries.Add(new CargoManifestEntryDataModel { Container = "HAZD0000001", Row = 1, Bay = 1, Tier = 1, StorageArea = saMain, StorageAreaId = saMain.Id });
            var cm3b = new CargoManifestDataModel { Type = CargoManifestType.Unloading.ToString(), Entries = new List<CargoManifestEntryDataModel>() };
            cm3b.Entries.Add(new CargoManifestEntryDataModel { Container = "HAZD0000002", Row = 1, Bay = 2, Tier = 1, StorageArea = saMain, StorageAreaId = saMain.Id });
            n3.CargoManifests.Add(cm3a);
            n3.CargoManifests.Add(cm3b);
        }


        var eta3 = now.AddDays(10);
        var etd3 = eta3.AddDays(1);
        var n4 = new VesselVisitNotificationDataModel
        {
            Code = $"{now.Year}-PA-{4.ToString("D6")}",
            Vessel = vesselRecords[1],
            VesselId = vesselRecords[1].Id,
            Representative = representatives[3],
            RepresentativeId = representatives[3].Id,
            ETA = eta3,
            ETD = etd3,
            CargoManifests = new List<CargoManifestDataModel>(),
            CargoType = CargoType.Container.ToString(),
            Volume = 400.0,
            CrewMembers = new List<CrewMemberDataModel>
            {
                new CrewMemberDataModel { Name = "Captain 4", CitizenId = "CPT004", Rank = CrewRank.Captain.ToString(), Nationality = "PT" }
            },
            AssignedDock = null,
            VisitStatus = VisitStatus.InProgress.ToString(),
            LastModifiedAt = now,
            NumberOfCrewMembers = 10
        };



        var n5 = new VesselVisitNotificationDataModel
        {
            Code = $"{now.Year}-PA-{5.ToString("D6")}",
            Vessel = vesselRecords[1],
            VesselId = vesselRecords[1].Id,
            Representative = representatives[3],
            RepresentativeId = representatives[3].Id,
            ETA = new DateTime(2026, 1, 1, 13, 0, 0),
            ETD = new DateTime(2026, 1, 1, 23, 0, 0),
            CargoManifests = new List<CargoManifestDataModel>(),
            CargoType = CargoType.Container.ToString(),
            Volume = 300.0,
            CrewMembers = new List<CrewMemberDataModel>
            {
                new CrewMemberDataModel { Name = "Captain 5", CitizenId = "CPT005", Rank = CrewRank.Captain.ToString(), Nationality = "PT" }
            },
            AssignedDock = docks[0],
            VisitStatus = VisitStatus.Approved.ToString(),
            LastModifiedAt = now,
            NumberOfCrewMembers = 10
        };

        var cm5 = new List<CargoManifestDataModel>();
        AddContainers(cm5, storageAreas, 20, 15);
        n5.CargoManifests = cm5;


        var n6 = new VesselVisitNotificationDataModel
        {
            Code = $"{now.Year}-PA-{6.ToString("D6")}",
            Vessel = vesselRecords[2],
            VesselId = vesselRecords[2].Id,
            Representative = representatives[3],
            RepresentativeId = representatives[3].Id,
            ETA = new DateTime(2026, 1, 1, 10, 0, 0),
            ETD = new DateTime(2026, 1, 1, 17, 0, 0),
            CargoManifests = new List<CargoManifestDataModel>(),
            CargoType = CargoType.Container.ToString(),
            Volume = 300.0,
            CrewMembers = new List<CrewMemberDataModel>
            {
                new CrewMemberDataModel { Name = "Captain 6", CitizenId = "CPT006", Rank = CrewRank.Captain.ToString(), Nationality = "PT" }
            },
            AssignedDock = docks[0],
            VisitStatus = VisitStatus.Approved.ToString(),
            LastModifiedAt = now,
            NumberOfCrewMembers = 10
        };

        var cm6 = new List<CargoManifestDataModel>();
        AddContainers(cm6, storageAreas, 50, 0);
        n6.CargoManifests = cm6;


        var n7 = new VesselVisitNotificationDataModel
        {
            Code = $"{now.Year}-PA-{7.ToString("D6")}",
            Vessel = vesselRecords[3],
            VesselId = vesselRecords[3].Id,
            Representative = representatives[3],
            RepresentativeId = representatives[3].Id,
            ETA = new DateTime(2026, 1, 1, 7, 0, 0),
            ETD = new DateTime(2026, 1, 1, 15, 0, 0),
            CargoManifests = new List<CargoManifestDataModel>(),
            CargoType = CargoType.Container.ToString(),
            Volume = 400.0,
            CrewMembers = new List<CrewMemberDataModel>
            {
                new CrewMemberDataModel { Name = "Captain 7", CitizenId = "CPT007", Rank = CrewRank.Captain.ToString(), Nationality = "ES" }
            },
            AssignedDock = docks[0],
            VisitStatus = VisitStatus.Approved.ToString(),
            LastModifiedAt = now,
            NumberOfCrewMembers = 10
        };

        var cm7 = new List<CargoManifestDataModel>();
        AddContainers(cm7, storageAreas, 50, 50);
        n7.CargoManifests = cm7;


        var n8 = new VesselVisitNotificationDataModel
        {
            Code = $"{now.Year}-PA-{8.ToString("D6")}",
            Vessel = vesselRecords[4],
            VesselId = vesselRecords[4].Id,
            Representative = representatives[3],
            RepresentativeId = representatives[3].Id,
            ETA = new DateTime(2026, 1, 1, 0, 0, 0),
            ETD = new DateTime(2026, 1, 1, 10, 0, 0),
            CargoManifests = new List<CargoManifestDataModel>(),
            CargoType = CargoType.Container.ToString(),
            Volume = 400.0,
            CrewMembers = new List<CrewMemberDataModel>
            {
                new CrewMemberDataModel { Name = "Captain 8", CitizenId = "CPT008", Rank = CrewRank.Captain.ToString(), Nationality = "FR" }
            },
            AssignedDock = docks[0],
            VisitStatus = VisitStatus.Approved.ToString(),
            LastModifiedAt = now,
            NumberOfCrewMembers = 10
        };

        var cm8 = new List<CargoManifestDataModel>();
        AddContainers(cm8, storageAreas, 0, 50);
        n8.CargoManifests = cm8;

        notifications.Add(n1);
        notifications.Add(n2);
        notifications.Add(n3);
        notifications.Add(n4);
        notifications.Add(n5);
        notifications.Add(n6);
        notifications.Add(n7);
        notifications.Add(n8);

        return notifications;
    }


    public static List<(ShippingAgentOrganizationDataModel organization, List<RepresentativeDataModel> representatives)> GetSeedingOrganizationDataModelsAndRepresentatives()
    {
        var org1 = new ShippingAgentOrganizationDataModel
        {
            Code = "AAA1",
            LegalName = "LegalName1",
            AlternativeName = "AltName1",
            Address = "Address1",
            TaxNumber = "TaxNumber1",
            LastModifiedAt = DateTime.UtcNow
        };
        var org2 = new ShippingAgentOrganizationDataModel
        {
            Code = "BBB2",
            LegalName = "LegalName2",
            AlternativeName = "AltName2",
            Address = "Address2",
            TaxNumber = "TaxNumber2",
            LastModifiedAt = DateTime.UtcNow
        };

        var rep1_org1 = new RepresentativeDataModel
        {
            Name = "Rep1 Org1",
            CitizenId = "CID1",
            Nationality = "PT",
            Email = "rep1org1@email.com",
            PhoneNumber = "911111111",
            Organization = org1,
            LastModifiedAt = DateTime.UtcNow
        };
        var rep2_org1 = new RepresentativeDataModel
        {
            Name = "Rep2 Org1",
            CitizenId = "CID2",
            Nationality = "PT",
            Email = "rep2org1@email.com",
            PhoneNumber = "922222222",
            Organization = org1,
            LastModifiedAt = DateTime.UtcNow
        };

        var rep1_org2 = new RepresentativeDataModel
        {
            Name = "Rep1 Org2",
            CitizenId = "CID3",
            Nationality = "ES",
            Email = "rep1org2@email.com",
            PhoneNumber = "933333333",
            Organization = org2,
            LastModifiedAt = DateTime.UtcNow
        };
        var rep2_org2 = new RepresentativeDataModel
        {
            Name = "Rep2 Org2",
            CitizenId = "CID4",
            Nationality = "ES",
            Email = "rep2org2@email.com",
            PhoneNumber = "944444444",
            Organization = org2,
            LastModifiedAt = DateTime.UtcNow
        };

        return new List<(ShippingAgentOrganizationDataModel, List<RepresentativeDataModel>)>
        {
            (org1, new List<RepresentativeDataModel> { rep1_org1, rep2_org1 }),
            (org2, new List<RepresentativeDataModel> { rep1_org2, rep2_org2 })
        };
    }

    public static List<QualificationDataModel> GetSeedingQualificationsDataModel()
    {
        return new List<QualificationDataModel>()
        {
            new QualificationDataModel { Code = "STSOP", Name = "STS Crane Operator", Description = "Qualified to operate STS cranes." },
            new QualificationDataModel { Code = "MBLOP", Name = "Mobile Crane Operator", Description = "Qualified to operate mobile cranes." },
            new QualificationDataModel { Code = "TRUCKDR", Name = "Truck Driver", Description = "Qualified to drive trucks." }
        };
    }

    public static List<PhysicalResourceDataModel> GetSeedingPhysicalResourcesDataModel(List<QualificationDataModel> qualifications)
    {
        var stsOpQual = qualifications.FirstOrDefault(q => q.Code == "STSOP");
        var mbOpQual = qualifications.FirstOrDefault(q => q.Code == "MBLOP");
        var truckDriverQual = qualifications.FirstOrDefault(q => q.Code == "TRUCKDR");

        var resources = new List<PhysicalResourceDataModel>();
        if (stsOpQual != null)
        {
            resources.Add(new PhysicalResourceDataModel
            {
                Code = "STS001",
                Name = "STS Crane 1",
                Description = "Ship-to-Shore Crane 1",
                Kind = PhysicalResourceKind.STSCrane,
                SetupTimeMinutes = 30,
                OperationalCapacity = 50,
                AssignedDockName = "Dock A",
                QualificationRequirements = new List<QualificationDataModel> { stsOpQual },
                StartDay = DayOfWeek.Monday,
                EndDay = DayOfWeek.Saturday,
                StartTime = new TimeSpan(6, 0, 0),
                EndTime = new TimeSpan(22, 0, 0),
                Status = ResourceStatus.Available
            });
        }

        if (truckDriverQual != null)
        {
            resources.Add(new PhysicalResourceDataModel
            {
                Code = "TRUCK001",
                Name = "Truck 1",
                Description = "Transport Truck 1",
                Kind = PhysicalResourceKind.Truck,
                SetupTimeMinutes = 15,
                OperationalCapacity = 20,
                AssignedStorageAreaCode = "WH001",
                QualificationRequirements = new List<QualificationDataModel> { truckDriverQual },
                StartDay = DayOfWeek.Monday,
                EndDay = DayOfWeek.Friday,
                StartTime = new TimeSpan(7, 0, 0),
                EndTime = new TimeSpan(19, 0, 0),
                Status = ResourceStatus.Available
            });
        }

        if (mbOpQual != null)
        {
            resources.Add(new PhysicalResourceDataModel
            {
                Code = "MBL001",
                Name = "Mobile Crane 1",
                Description = "Mobile Crane 1",
                Kind = PhysicalResourceKind.MobileCrane,
                SetupTimeMinutes = 20,
                OperationalCapacity = 30,
                QualificationRequirements = new List<QualificationDataModel> { mbOpQual },
                StartDay = DayOfWeek.Monday,
                EndDay = DayOfWeek.Friday,
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(18, 0, 0),
                Status = ResourceStatus.Available
            });
        }

        return resources;
    }



    private static void AddContainers(List<CargoManifestDataModel> cargoManifest, List<StorageAreaDataModel> storageAreas, int numberOfContainersLoading, int numberOfContainersUnloading)
    {
        var random = new Random();
        string GenerateContainerCode()
        {
            const string letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var sb = new StringBuilder();
            for (int i = 0; i < 4; i++)
            {
                sb.Append(letters[random.Next(letters.Length)]);
            }
            for (int i = 0; i < 7; i++)
            {
                sb.Append(random.Next(0, 9));
            }
            return sb.ToString();
        }

        List<CargoManifestEntryDataModel> GenerateEntries(int count)
        {
            var entries = new List<CargoManifestEntryDataModel>();
            for (int i = 0; i < count; i++)
            {
                entries.Add(new CargoManifestEntryDataModel
                {
                    Container = GenerateContainerCode(),
                    Row = random.Next(1, 6),
                    Bay = random.Next(1, 10),
                    Tier = random.Next(1, 4),
                    StorageArea = storageAreas[0],
                    StorageAreaId = storageAreas[0].Id
                });
            }

            return entries;
        }
        cargoManifest.Add(new CargoManifestDataModel
        {
            Type = CargoManifestType.Loading.ToString(),
            Entries = GenerateEntries(numberOfContainersLoading)
        });
        cargoManifest.Add(new CargoManifestDataModel
        {
            Type = CargoManifestType.Unloading.ToString(),
            Entries = GenerateEntries(numberOfContainersUnloading)
        });
    }
}