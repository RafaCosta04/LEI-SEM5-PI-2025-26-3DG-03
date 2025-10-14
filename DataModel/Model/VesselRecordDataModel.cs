using System.ComponentModel.DataAnnotations;
using Domain.Model;

namespace DataModel.Model;

public class VesselRecordDataModel
{

    public long Id { get; set; }

    [Required]
    public string? IMONumber { get; set; }

    [Required]
    public string? VesselName { get; set; }

    [Required]
    public VesselTypeDataModel? VesselType { get; set; }

    [Required]
    public string? Operator { get; set; }

    public VesselRecordDataModel() { }

    public VesselRecordDataModel(VesselRecord vesselRecord)
    {
        Id = vesselRecord.Id;
        IMONumber = vesselRecord.IMONumber;
        VesselName = vesselRecord.VesselName;
        if (vesselRecord.VesselType != null)
            VesselType = new VesselTypeDataModel(vesselRecord.VesselType);
        Operator = vesselRecord.Operator;
    }

}

