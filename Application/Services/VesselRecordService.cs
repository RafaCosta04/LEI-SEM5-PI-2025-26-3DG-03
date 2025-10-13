namespace Application.Services;

using Domain.Model;
using Application.DTO;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;

public class VesselRecordService
{
    private readonly IVesselRecordRepository _vesselRecordRepository;

    public VesselRecordService(IVesselRecordRepository vesselRecordRepository)
    {
        _vesselRecordRepository = vesselRecordRepository;
    }

    public async Task<IEnumerable<VesselRecordDTO>> GetAllVesselRecords()
    {
        IEnumerable<VesselRecord> vesselRecords = await _vesselRecordRepository.GetVesselRecordsAsync();
        IEnumerable<VesselRecordDTO> vesselRecordDTOs = VesselRecordDTO.ToDTO(vesselRecords);
        return vesselRecordDTOs;
    }

    public async Task<VesselRecordDTO?> GetVesselRecordByIMONumber(int imoNumber)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByImoNumberAsync(imoNumber);
        if (vesselRecord != null)
        {
            VesselRecordDTO vesselRecordDTO = VesselRecordDTO.ToDTO(vesselRecord);
            return vesselRecordDTO;
        }
        return null;
    }

    public async Task<VesselRecordDTO?> GetVesselRecordById(long id)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByIdAsync(id);
        if (vesselRecord != null)
        {
            VesselRecordDTO vesselRecordDTO = VesselRecordDTO.ToDTO(vesselRecord);
            return vesselRecordDTO;
        }
        return null;
    }

    public async Task<VesselRecordDTO?> GetVesselRecordByVesselName(string name)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByVesselNameAsync(name);
        if (vesselRecord != null)
        {
            VesselRecordDTO vesselRecordDTO = VesselRecordDTO.ToDTO(vesselRecord);
            return vesselRecordDTO;
        }
        return null;
    }

    public async Task<VesselRecordDTO?> GetVesselRecordByOperator(string operatorName)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByOperatorAsync(operatorName);
        if (vesselRecord != null)
        {
            VesselRecordDTO vesselRecordDTO = VesselRecordDTO.ToDTO(vesselRecord);
            return vesselRecordDTO;
        }
        return null;
    }

    public async Task<VesselRecordDTO?> AddVesselRecord(VesselRecordDTO vesselRecordDTO, List<string> errorMessages)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByImoNumberAsync(vesselRecordDTO.IMONumber);
        if (vesselRecord != null)
        {
            errorMessages.Add("Vessel Record with this IMO Number Already Exists!");
            return null;
        }
        vesselRecord = VesselRecordDTO.ToDomain(vesselRecordDTO);
        VesselRecord vesselRecordSaved = await _vesselRecordRepository.AddVesselRecord(vesselRecord);
        VesselRecordDTO vrDTO = VesselRecordDTO.ToDTO(vesselRecordSaved);
        return vrDTO;
    }

    public async Task<bool> UpdateVesselRecord(int imoNumber, VesselRecordDTO vesselRecordDTO, List<string> errorMessages)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByImoNumberAsync(imoNumber);
        if (vesselRecord != null)
        {
            VesselRecordDTO.UpdateToDomain(vesselRecord, vesselRecordDTO);
            await _vesselRecordRepository.Update(vesselRecord, errorMessages);
            return true;
        }
        else
        {
            errorMessages.Add("Vessel Record Not Found!");
            return false;
        }
    }
}