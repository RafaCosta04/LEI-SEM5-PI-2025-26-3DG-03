using Microsoft.AspNetCore.Mvc;


namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Domain.Factory;
using Microsoft.AspNetCore.Authorization;


[ApiController]
[Route("api/Scheduling")]
//[Authorize]
public class SchedulingController : ControllerBase
{

    private readonly SchedulingService _schedulingService;
    private readonly SystemUserService _systemUserService;
    List<string> _errorMessages = new List<string>();

    public SchedulingController(SchedulingService schedulingService, SystemUserService systemUserService)
    {
        _schedulingService = schedulingService;
        _systemUserService = systemUserService;
    }

    [HttpGet]
    public async Task<ActionResult<SchedulingDTO>> GetSchedullingForTargetDay(DateTime targetDay, string algorithm = "default")
    {
        SchedulingDTO? notifications = await _schedulingService.GetSchedulingForTargetDay(targetDay, _errorMessages, algorithm);
        if (_errorMessages.Count > 0)
        {
            var msg = string.Join("; ", _errorMessages);
            if (_errorMessages.Any(m => m.Contains("No vessel visit notifications found", StringComparison.OrdinalIgnoreCase)))
            {
                return NotFound(new { message = "Vessel Visit Notification not found" });
            }
            if (_errorMessages.Any(m => m.Contains("No available STS Crane found", StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(new { message = msg });
            }
            return BadRequest(new { message = msg });
        }
        return Ok(notifications);
    }

    [HttpGet("GeneticAlgorithm")]
    public async Task<ActionResult<SchedulingDTO>> GetSchedullingWithGeneticAlgorithm(DateTime targetDay, int populationSize, int generations, double crossoverRate, double mutationRate, int desiredTime, int stableGenerations, bool enableMultiCrane)
    {
        SchedulingDTO? notifications = await _schedulingService.GetSchedulingWithGeneticAlgortithm(targetDay, populationSize, generations, crossoverRate, mutationRate, desiredTime, stableGenerations, enableMultiCrane, _errorMessages);
        if (_errorMessages.Count > 0)
        {
            var msg = string.Join("; ", _errorMessages);
            if (_errorMessages.Any(m => m.Contains("No vessel visit notifications found", StringComparison.OrdinalIgnoreCase)))
            {
                return NotFound(new { message = "Vessel Visit Notification not found" });
            }
            if (_errorMessages.Any(m => m.Contains("No available STS Crane found", StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(new { message = msg });
            }
            return BadRequest(new { message = msg });
        }
        return Ok(notifications);
    }

    [HttpGet("RebalancingAlgorithm")]
    public async Task<ActionResult<RebalancingDTO>> GetDocksAssingedWithRebalancingAlgorithm(DateTime targetDay, DateTime endDay)
    {
        RebalancingDTO? notifications = await _schedulingService.GetSchedulingWithRebalancingAlgorithm(targetDay, endDay, _errorMessages);
        if (_errorMessages.Count > 0)
        {
            var msg = string.Join("; ", _errorMessages);
            if (_errorMessages.Any(m => m.Contains("No vessel visit notifications found", StringComparison.OrdinalIgnoreCase)))
            {
                return NotFound(new { message = "Vessel Visit Notification not found" });
            }
            if (_errorMessages.Any(m => m.Contains("No available STS Crane found", StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(new { message = msg });
            }
            return BadRequest(new { message = msg });
        }
        return Ok(notifications);
    }

    [HttpPost("Rebalancing/Apply")]
    public async Task<IActionResult> ApplyRebalancing([FromQuery] DateTime targetDay, [FromQuery] DateTime endDay, [FromBody] RebalancingDTO rebalancing)
    {
        var email =
                User.FindFirst("https://lapr5/email")?.Value ??
                User.FindFirst("email")?.Value;
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized("No email claim found in Auth0 token.");
        }
        SystemUserDTO? user = await _systemUserService.GetSystemUserByEmail(email);
        if (user == null)
        {
            return NotFound("User not found.");
        }
        if (rebalancing == null)
        {
            return BadRequest(new { message = "Rebalancing payload is required." });
        }
        var ok = await _schedulingService.ApplyRebalancingAsync(rebalancing, targetDay, endDay, user.Id, _errorMessages);
        if (!ok)
        {
            var msg = string.Join("; ", _errorMessages);
            return BadRequest(new { message = msg });
        }
        return Ok(new { message = "Rebalancing applied successfully." });
    }

    [HttpPost("Rebalancing/Reject")]
    public IActionResult RejectRebalancing()
    {
        return Ok(new { message = "Rebalancing rejected. No changes applied." });
    }
}