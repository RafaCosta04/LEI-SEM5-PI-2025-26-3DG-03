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
    List<string> _errorMessages = new List<string>();

    public SchedulingController(SchedulingService schedulingService)
    {
        _schedulingService = schedulingService;
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
        SchedulingDTO? notifications = await _schedulingService.GetSchedulingWithGeneticAlgortithm(targetDay,populationSize, generations, crossoverRate, mutationRate, desiredTime, stableGenerations,enableMultiCrane, _errorMessages);
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


}