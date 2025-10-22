using Microsoft.AspNetCore.Mvc;
namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Domain.Model;


[ApiController]
[Route("api/VesselVisitNotification")]
public class VesselVisitNotificationController : ControllerBase
{
    private readonly VesselVisitNotificationService _vesselVisitNotificationService;
    List<string> _errorMessages = new List<string>();

    public VesselVisitNotificationController(VesselVisitNotificationService vesselVisitNotificationService)
    {
        _vesselVisitNotificationService = vesselVisitNotificationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VesselVisitNotificationDTO>>> GetAllVesselVisitNotifications()
    {
        IEnumerable<VesselVisitNotificationDTO> notifications = await _vesselVisitNotificationService.GetAllVesselVisitNotifications();
        return Ok(notifications);
    }

    [HttpGet("ById/{id}")]
    public async Task<ActionResult<VesselVisitNotificationDTO>> GetVesselVisitNotificationById(int id)
    {
        VesselVisitNotificationDTO? notificationDTO = await _vesselVisitNotificationService.GetVesselVisitNotificationById(id);
        if (notificationDTO == null)
        {
            return NotFound($"Vessel Visit Notification with ID '{id}' not found.");
        }
        return Ok(notificationDTO);
    }

    [HttpGet("ByCode/{code}")]
    public async Task<ActionResult<VesselVisitNotificationDTO>> GetVesselVisitNotificationByCode(string code)
    {
        VesselVisitNotificationDTO? notificationDTO = await _vesselVisitNotificationService.GetVesselVisitNotificationByCode(code);
        if (notificationDTO == null)
        {
            return NotFound($"Vessel Visit Notification with code '{code}' not found.");
        }
        return Ok(notificationDTO);
    }

    [HttpGet("ByOrg/{orgCode}")]
    public async Task<ActionResult<IEnumerable<VesselVisitNotificationDTO>>> GetVesselVisitNotificationByOrg(string orgCode)
    {
        IEnumerable<VesselVisitNotificationDTO> notifications = await _vesselVisitNotificationService.GetVesselVisitNotificationByOrg(orgCode);
        return Ok(notifications);
    }

    [HttpGet("ByVesselIMO_Org/{vesselIMO}/{orgCode}")]
    public async Task<ActionResult<IEnumerable<VesselVisitNotificationDTO>>> GetVesselVisitNotificationsByVesselIMO_Org(string vesselIMO, string orgCode)
    {
        IEnumerable<VesselVisitNotificationDTO> notifications = await _vesselVisitNotificationService.GetVesselVisitNotificationsByVesselIMO_Org(vesselIMO, orgCode);
        return Ok(notifications);
    }
    [HttpGet("ByDateRange_Org/{startDate}/{endDate}/{orgCode}")]
    public async Task<ActionResult<IEnumerable<VesselVisitNotificationDTO>>> GetVesselVisitNotificationsByDateRange_Org(DateTime startDate, DateTime endDate, string orgCode)
    {
        IEnumerable<VesselVisitNotificationDTO> notifications = await _vesselVisitNotificationService.GetVesselVisitNotificationsByDateRange_Org(startDate, endDate, orgCode);
        return Ok(notifications);
    }

    [HttpGet("ByRepresentative/{citizenId}")]
    public async Task<ActionResult<IEnumerable<VesselVisitNotificationDTO>>> GetVesselVisitNotificationsByRepresentative(string citizenId)
    {
        IEnumerable<VesselVisitNotificationDTO> notifications = await _vesselVisitNotificationService.GetVesselVisitNotificationsByRepresentative(citizenId);
        return Ok(notifications);
    }

    [HttpGet("ByStatus_Org/{status}/{orgCode}")]
    public async Task<ActionResult<IEnumerable<VesselVisitNotificationDTO>>> GetVesselVisitNotificationsByStatus_Org(VisitStatus status, string orgCode)
    {
        IEnumerable<VesselVisitNotificationDTO> notifications = await _vesselVisitNotificationService.GetVesselVisitNotificationsByStatus_Org(status, orgCode);
        return Ok(notifications);
    }

    [HttpPost]
    public async Task<ActionResult<VesselVisitNotificationDTO>> PostVesselVisitNotification([FromBody] VesselVisitNotificationDTO vesselVisitNotificationDTO)
    {
        if (vesselVisitNotificationDTO == null)
        {
            return BadRequest("Vessel Visit Notification data must be provided.");
        }

        VesselVisitNotificationDTO? createdNotificationDTO = await _vesselVisitNotificationService.AddVesselVisitNotification(vesselVisitNotificationDTO, _errorMessages);
        if (createdNotificationDTO == null || _errorMessages.Any())
        {
            if (_errorMessages.Contains("Vessel Visit Notification with the same code already exists."))
            {
                return Conflict(_errorMessages);
            }
            {
                _errorMessages.Add("Unknown error occurred while creating Vessel Visit Notification.");
            }
            return BadRequest(_errorMessages);
        }

        return CreatedAtAction(nameof(GetVesselVisitNotificationById), new { id = createdNotificationDTO.Id }, createdNotificationDTO);
    }

    [HttpPut("Update/{visitCode}")]
    public async Task<IActionResult> PutVesselVisitNotification(string visitCode, VesselVisitNotificationDTO vesselVisitNotificationDTO)
    {
        if (vesselVisitNotificationDTO == null)
        {
            return BadRequest("Vessel Visit Notification data must be provided.");
        }

        bool wasUpdated = await _vesselVisitNotificationService.UpdateVesselVisitNotification(visitCode, vesselVisitNotificationDTO, _errorMessages);
        if (!wasUpdated && _errorMessages.Any())
        {
            if (_errorMessages.Contains("Vessel Visit Notification not found."))
            {
                return NotFound(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }
        return Ok();
    }

}