using System.Data.Common;
using DataModel.Model;
using DataModel.Repository;
using Domain.Model;


namespace WebApi.IntegrationTests.Helpers;

public static class Utilities
{
    public static void InitializeDbForTests(OEMContext db)
    {
        db.Database.EnsureCreated();

        db.IncidentTypes.AddRange(GetSeedingIncidentTypesParents());
        db.SaveChanges();

        db.IncidentTypes.AddRange(GetSeedingIncidentTypesChildren(db));
        db.SaveChanges();

    }

    public static void ReinitializeDbForTests(OEMContext db)
    {
        db.Database.EnsureCreated();
        db.IncidentTypes.RemoveRange(db.IncidentTypes);


        db.SaveChanges();
        InitializeDbForTests(db);
    }




     public static List<IncidentTypeDataModel> GetSeedingIncidentTypesParents()
    {
        var incidentTypes = new List<IncidentTypeDataModel>
        {
            new IncidentTypeDataModel
            {
                Code = "ENV-COND",
                Name = "Environmental Conditions",
                Description = "Environmental Conditions related incident",
                Classification = IncidentClassification.Major
            },
            new IncidentTypeDataModel
            {
                Code = "OPR-FAIL",
                Name = "Operational Failures",
                Description = "Operational Failures related incident",
                Classification = IncidentClassification.Major
            },
            new IncidentTypeDataModel
            {
                Code = "SEC-EVT",
                Name = "Security Events",
                Description = "Security Events related incident",
                Classification = IncidentClassification.Critical
            }
        };

        return incidentTypes;
    }

    public static List<IncidentTypeDataModel> GetSeedingIncidentTypesChildren(OEMContext context)
    {
        var parent1 = context.IncidentTypes.First(it => it.Code == "ENV-COND");
        var parent2 = context.IncidentTypes.First(it => it.Code == "OPR-FAIL");
        var parent3 = context.IncidentTypes.First(it => it.Code == "SEC-EVT");
        var incidentTypes = new List<IncidentTypeDataModel>
        {
            new IncidentTypeDataModel
            {
                Code = "FOG",
                Name = "Fog",
                Description = "Incidents related to fog conditions",
                Classification = IncidentClassification.Minor,
                ParentIncidentTypeId = parent1.Id
            },
            new IncidentTypeDataModel
            {
                Code = "CRANE-MALF",
                Name = "Crane Malfunctions",
                Description = "Incidents related to crane malfunctions",
                Classification = IncidentClassification.Major,
                ParentIncidentTypeId = parent2.Id
            },
            new IncidentTypeDataModel
            {
                Code = "SEC-BREACH",
                Name = "Security Breaches",
                Description = "Incidents related to unauthorized access or security breaches",
                Classification = IncidentClassification.Critical,
                ParentIncidentTypeId = parent3.Id
            }
        };
        return incidentTypes;
    }
}