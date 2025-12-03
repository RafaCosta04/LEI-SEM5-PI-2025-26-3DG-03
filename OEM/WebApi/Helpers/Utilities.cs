using DataModel.Repository;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Text;
using System.Collections.Generic;
namespace WebApi.Helpers;

using DataModel.Model;
using Domain.Model;
using Microsoft.EntityFrameworkCore;




public static class Utilities
{
    private static bool _isInitialized = false;
    private static readonly object _lock = new object();

    public static void InitializeDatabase(WebApplication app)
    {
        lock (_lock)
        {
            if(_isInitialized) return;
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<OEMContext>();

                if(db.IncidentTypes.Any())
                {
                    _isInitialized = true;
                    return;
                }

                //Seed initial data
                db.IncidentTypes.AddRange(GetSeedingIncidentTypesParents());
                db.SaveChanges();

                db.IncidentTypes.AddRange(GetSeedingIncidentTypesChildren(db));
                db.SaveChanges();
            }
        }
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