namespace DataModel.Repository;

using Microsoft.EntityFrameworkCore;

using DataModel.Model;
using Domain.Model;

public interface IShippingManagementContext
{
    DbSet<VesselTypeDataModel> VesselTypes { get; set; }
    DbSet<DockDataModel> Docks { get; set; }
}