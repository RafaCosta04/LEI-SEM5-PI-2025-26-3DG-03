using Microsoft.AspNetCore.Mvc;


namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Domain.Factory;

[ApiController]
[Route("api/Scheduling")]
public class SchedulingController : ControllerBase
{

    private readonly SchedulingService _schedulingService;
    List<string> _errorMessages = new List<string>();

    public SchedulingController(SchedulingService schedulingService)
    {
        _schedulingService = schedulingService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SchedulingDTO>>> GetSchedullingForTargetDay(DateTime targetDay)
    {
        IEnumerable<SchedulingDTO> notifications = await _schedulingService.GetSchedulingForTargetDay(targetDay);
        return Ok(notifications);
    }


}