using Microsoft.AspNetCore.Mvc;
namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Domain.IRepository;
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
}