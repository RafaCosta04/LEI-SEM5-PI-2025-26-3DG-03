namespace DataModel.Mapper;

using DataModel.Model;
using Domain.Factory;
using Domain.Model;

public class VesselRecordMapper
{
    private IVesselRecordFactory _vesselRecordFactory;
    private VesselTypeMapper _vesselTypeMapper;

    public VesselRecordMapper(IVesselRecordFactory vesselRecordFactory, VesselTypeMapper vesselTypeMapper)
    {
        _vesselRecordFactory = vesselRecordFactory;
        _vesselTypeMapper = vesselTypeMapper;
    }

    public VesselRecord ToDomain(VesselRecordDataModel vesselRecordDM)
    {
        VesselType? vesselType = null;
        if (vesselRecordDM.VesselType != null)
            vesselType = _vesselTypeMapper.ToDomain(vesselRecordDM.VesselType);

        VesselRecord vesselRecordDomain = _vesselRecordFactory.NewVesselRecord(vesselRecordDM.IMONumber, vesselRecordDM.VesselName!, vesselType!, vesselRecordDM.Operator!);
        vesselRecordDomain.Id = vesselRecordDM.Id;
        return vesselRecordDomain;
    }

    public IEnumerable<VesselRecord> ToDomain(IEnumerable<VesselRecordDataModel> vesselRecordDataModels)
    {
        List<VesselRecord> vesselRecordsDomain = new List<VesselRecord>();

        foreach (VesselRecordDataModel vesselRecordDataModel in vesselRecordDataModels)
        {
            VesselRecord vesselRecord = ToDomain(vesselRecordDataModel);
            vesselRecordsDomain.Add(vesselRecord);
        }
        return vesselRecordsDomain.AsEnumerable();
    }

    public VesselRecordDataModel ToDataModel(VesselRecord vesselRecord)
    {
        VesselRecordDataModel vesselRecordDataModel = new VesselRecordDataModel(vesselRecord);
        if (vesselRecord.VesselType != null)
            vesselRecordDataModel.VesselType = new VesselTypeDataModel(vesselRecord.VesselType);
        return vesselRecordDataModel;
    }

    public void UpdateDataModel(VesselRecordDataModel vesselRecordDM, VesselRecord vesselRecord)
    {
        vesselRecordDM.IMONumber = vesselRecord.IMONumber;
        vesselRecordDM.VesselName = vesselRecord.VesselName;
        if (vesselRecord.VesselType != null)
            vesselRecordDM.VesselType = new VesselTypeDataModel(vesselRecord.VesselType);
        vesselRecordDM.Operator = vesselRecord.Operator;
    }
}

