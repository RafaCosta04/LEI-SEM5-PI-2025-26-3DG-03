namespace Application.DTO;

using Domain.Model;

public class VesselRecordDTO
{

    public string? IMONumber { get; set; }

    public string? VesselName { get; set; }

    public VesselTypeDTO? VesselType { get; set; }

    public string? Operator { get; set; }

    public VesselRecordDTO() { }

    public VesselRecordDTO(string imoNumber, string vesselName, VesselTypeDTO vesselType, string operatorName)
    {
        IMONumber = imoNumber;
        VesselName = vesselName;
        VesselType = vesselType;
        Operator = operatorName;
    }

    static public VesselRecordDTO ToDTO(VesselRecord vesselRecord)
    {
        try
        {
            VesselTypeDTO vesselTypeDTO = VesselTypeDTO.ToDTO(vesselRecord.VesselType!);
            VesselRecordDTO vesselRecordDTO = new VesselRecordDTO(vesselRecord.IMONumber, vesselRecord.VesselName!, vesselTypeDTO, vesselRecord.Operator!);
            return vesselRecordDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to VesselRecordDTO: {ex.Message}");
        }
    }

    static public IEnumerable<VesselRecordDTO> ToDTO(IEnumerable<VesselRecord> vesselRecords)
    {
        List<VesselRecordDTO> vesselRecordDTOs = new List<VesselRecordDTO>();
        foreach (VesselRecord vesselRecord in vesselRecords)
        {
            VesselRecordDTO vesselRecordDTO = ToDTO(vesselRecord);
            vesselRecordDTOs.Add(vesselRecordDTO);
        }
        return vesselRecordDTOs;
    }

    static public VesselRecord ToDomain(VesselRecordDTO vesselRecordDTO)
    {
        if (vesselRecordDTO.VesselName is null)
            throw new InvalidOperationException("VesselRecord.VesselName cannot be null");

        if (vesselRecordDTO.VesselType is null)
            throw new InvalidOperationException("VesselRecord.VesselType cannot be null");

        if (vesselRecordDTO.Operator is null)
            throw new InvalidOperationException("VesselRecord.Operator cannot be null");

        if (vesselRecordDTO.IMONumber.Length != 7)
            throw new ArgumentOutOfRangeException("IMONumber must have 7 digits.");

        VesselType vesselType = VesselTypeDTO.ToDomain(vesselRecordDTO.VesselType);
        VesselRecord vesselRecord = new VesselRecord(vesselRecordDTO.IMONumber, vesselRecordDTO.VesselName, vesselType, vesselRecordDTO.Operator);
        return vesselRecord;
    }

    static public VesselRecord UpdateToDomain(VesselRecord vesselRecord, VesselRecordDTO vesselRecordDTO)
    {
        vesselRecord.ChangeIMONumber(vesselRecordDTO.IMONumber);
        vesselRecord.ChangeVesselName(vesselRecordDTO.VesselName!);
        VesselType vesselType = VesselTypeDTO.ToDomain(vesselRecordDTO.VesselType!);
        vesselRecord.ChangeVesselType(vesselType);
        vesselRecord.ChangeOperator(vesselRecordDTO.Operator!);
        return vesselRecord;
    }

}