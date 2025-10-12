using DataModel.Repository;
using Microsoft.Extensions.DependencyInjection;
namespace WebApi.Helpers;

using DataModel.Model;
using Domain.Model;


public static class Utilities{

    public static void InitializeDbForApp(WebApplication app)
    {
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
            if (!db.VesselTypes.Any())
            {
                db.VesselTypes.AddRange(GetSeedingVesselTypesDataModel());
                db.SaveChanges(); 
            }
            if (!db.Docks.Any())
            {
                var vesselTypes = db.VesselTypes.ToList(); // agora já existem
                db.Docks.AddRange(GetSeedingDocksDataModel(vesselTypes));
                db.SaveChanges();
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
                VesselTypesAllowed = new List<VesselTypeDataModel> { vesselTypes[0], vesselTypes[1] }
            },
            new DockDataModel
            {
                Name = "Dock B",
                Location = "Port 2",
                Length = 300,
                Depth = 20,
                MaxDraft = 10,
                VesselTypesAllowed = new List<VesselTypeDataModel> { vesselTypes[0], vesselTypes[1], vesselTypes[2] }
            },
        };
    }
}