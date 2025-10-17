using Microsoft.AspNetCore.Mvc;
namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Domain.IRepository;
using Domain.Model;
using ShippingManagement.Domain.Qualifications;
using System.Collections.Generic;
using System.Threading.Tasks;


[ApiController]
[Route("api/Staff")]
public class StaffController : ControllerBase
{
    private readonly StaffService _staffService;
    private readonly IQualificationRepository _qualificationRepository;
    List<string> _errorMessages = new List<string>();

    public StaffController(StaffService staffService, IQualificationRepository qualificationRepository)
    {
        _staffService = staffService;
        _qualificationRepository = qualificationRepository;
    }

    [HttpGet("ByName/{name}")]
    public async Task<ActionResult<IEnumerable<StaffDTO>>> GetStaffByName(string name)
    {
        IEnumerable<StaffDTO>? staffDTO = await _staffService.GetStaffByName(name);
        if (staffDTO == null || !staffDTO.Any())
        {
            return NotFound($"Staff with name '{name}' not found.");
        }
        return Ok(staffDTO);
    }

    [HttpGet("ByID/{id}")]
    public async Task<ActionResult<StaffDTO>> GetStaffById(long id)
    {
        StaffDTO? staffDTO = await _staffService.GetStaffByID(id);
        if (staffDTO == null)
        {
            return NotFound($"Staff with ID '{id}' not found.");
        }
        return Ok(staffDTO);
    }

    [HttpGet("ByQualification/{qualificationCode}")]
    public async Task<ActionResult<IEnumerable<StaffDTO>>> GetStaffByQualification(string qualificationCode)
    {
        IEnumerable<StaffDTO>? staffDTO = await _staffService.GetStaffByQualification(qualificationCode);
        if (staffDTO == null || !staffDTO.Any())
        {
            return NotFound($"No staff found with qualification code '{qualificationCode}'.");
        }
        return Ok(staffDTO);
    }

    [HttpGet("ByStatus/{status}")]
    public async Task<ActionResult<IEnumerable<StaffDTO>>> GetStaffByStatus(ResourceStatus status)
    {
        IEnumerable<StaffDTO>? staffDTO = await _staffService.GetStaffByStatus(status, _errorMessages);
        if (staffDTO == null && _errorMessages.Any())
        {
            if (_errorMessages.Any(msg =>
                msg.Contains("already exists", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("Already exists", StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }
        return Ok(staffDTO);
    }
    
    [HttpPost]
    public async Task<ActionResult<StaffDTO>> PostStaff(StaffDTO staffDTO)
    {
        if (staffDTO == null)
        {
            return BadRequest("Staff data is null.");
        }
        if (staffDTO.QualificationCodes == null || !staffDTO.QualificationCodes.Any())
        {
            return BadRequest("At least one QualificationCode must be provided to create a Staff.");
        }
        IEnumerable<Qualification> qualification = await _qualificationRepository.GetQualificationsByCodesAsync(staffDTO.QualificationCodes!);
        StaffDTO? createdStaff = await _staffService.AddStaff(staffDTO, qualification, _errorMessages);
        if (createdStaff == null)
        {
            return BadRequest(_errorMessages);
        }
        return CreatedAtAction(nameof(GetStaffByName), new { name = createdStaff.Name }, createdStaff);
    }

    [HttpPut("Update/{id}")]
    public async Task<IActionResult> PutStaff(long id, StaffDTO staffDTO)
    {
        if (staffDTO == null)
        {
            return BadRequest("Staff data must be provided.");
        }
        IEnumerable<Qualification> qualification = await _qualificationRepository.GetQualificationsByCodesAsync(staffDTO.QualificationCodes!);
        bool wasUpdated = await _staffService.UpdateStaff(id, staffDTO, qualification, _errorMessages);
        if (!wasUpdated && _errorMessages.Any())
        {
            if (_errorMessages.Any(msg =>
                msg.Contains("already exists", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("Already exists", StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }
        return Ok();
    }
}