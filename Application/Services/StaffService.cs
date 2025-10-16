namespace Application.Services;

using Domain.Model;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using ShippingManagement.Domain.Qualifications;
using Application.DTO;

public class StaffService
{
    private readonly IStaffRepository _staffRepository;
    public StaffService(IStaffRepository staffRepository)
    {
        _staffRepository = staffRepository;
    }

    public async Task<IEnumerable<StaffDTO>> GetStaffByName(String name)
    {
        IEnumerable<Staff> staffs = await _staffRepository.GetStaffByNameAsync(name);
        List<StaffDTO> StaffDTOs = new List<StaffDTO>();
        foreach (var s in staffs)
        {
            StaffDTOs.Add(StaffDTO.ToDTO(s));
        }
        return StaffDTOs;
    }

    public async Task<StaffDTO?> AddStaff(StaffDTO staffDTO, IEnumerable<Qualification> qualifications, List<String> errorMessages)
    {
        if (qualifications == null)
        {
            errorMessages.Add("At least one valid QualificationCode must be provided to create a Staff.");
            return null;
        }
        Staff staff;
        Staff? staffByID = await _staffRepository.GetStaffByIDAsync(staffDTO.Id!.Value);
        if (staffByID != null)
        {
            errorMessages.Add($"Staff with ID '{staffDTO.Id}' already exist.");
            return null;
        }

        Staff? staffByEmail = await _staffRepository.GetStaffByEmailAsync(staffDTO.Email!);
        if (staffByEmail != null)
        {
            errorMessages.Add($"Staff with email '{staffDTO.Email}' already exists.");
            return null;
        }

        Staff? staffByPhone = await _staffRepository.GetStaffByPhoneAsync(staffDTO.Phone!);
        if (staffByPhone != null)
        {
            errorMessages.Add($"Staff with phone '{staffDTO.Phone}' already exists.");
            return null;
        }

        try
        {
            OperationalWindow opWindow = OperationalWindowDTO.ToDomain(staffDTO.OperationalWindow!);
            staff = StaffDTO.ToDomain(staffDTO, qualifications, opWindow);
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return null;
        }

        Staff staffSaved = await _staffRepository.AddStaff(staff);
        StaffDTO sDTO = StaffDTO.ToDTO(staffSaved);
        return sDTO;
    }
}