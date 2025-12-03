using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

using Application.DTO;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Org.BouncyCastle.Crypto;

[ApiController]
[Route("api/IncidentType")]
public class IncidentTypeController : ControllerBase
{
    private readonly IncidentTypeService _incidentTypeService;

    List<string> _errorMessages = new List<string>();

    public IncidentTypeController(IncidentTypeService incidentTypeService)
    {
        _incidentTypeService = incidentTypeService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<IncidentTypeDTO>>> GetAllIncidentTypes()
    {
        IEnumerable<IncidentTypeDTO> incidentTypes = await _incidentTypeService.GetAllIncidentTypes();
        return Ok(incidentTypes);
    }

    [HttpGet("ById/{id}")]
    public async Task<ActionResult<IncidentTypeDTO>> GetIncidentTypeById(long id)
    {
        IncidentTypeDTO? incidentType = await _incidentTypeService.GetIncidentTypeByIdAsync(id);
        if (incidentType == null)
        {
            return NotFound($"Incident Type with Id {id} not found.");
        }
        return Ok(incidentType);
    }

    [HttpGet("ByCode/{code}")]
    public async Task<ActionResult<IncidentTypeDTO>> GetIncidentTypeByCode(string code)
    {
        IncidentTypeDTO? incidentType = await _incidentTypeService.GetIncidentTypeByCodeAsync(code);
        if (incidentType == null)
        {
            return NotFound($"Incident Type with Code {code} not found.");
        }
        return Ok(incidentType);
    }

    [HttpGet("ByClassification/{classification}")]
    public async Task<ActionResult<IEnumerable<IncidentTypeDTO>>> GetIncidentTypesByClassification(string classification)
    {
        IEnumerable<IncidentTypeDTO> incidentTypes = await _incidentTypeService.GetIncidentTypesByClassificationAsync(Enum.Parse<Domain.Model.IncidentClassification>(classification));
        return Ok(incidentTypes);
    }

    [HttpGet("ByParent/{code}")]
    public async Task<ActionResult<IEnumerable<IncidentTypeDTO>>> GetIncidentTypesByParent(string code)
    {
        IEnumerable<IncidentTypeDTO> incidentTypes = await _incidentTypeService.GetIncidentTypesByParentAsync(code);
        return Ok(incidentTypes);
    }

    [HttpGet("/WithParent/{hasParent}")]
    public async Task<ActionResult<IEnumerable<IncidentTypeDTO>>> GetIncidentTypesWithParent(bool hasParent)
    {
        IEnumerable<IncidentTypeDTO> incidentTypes = await _incidentTypeService.GetIncidentTypesWithParentAsync(hasParent);
        return Ok(incidentTypes);
    }

    [HttpPost]
    public async Task<ActionResult<IncidentTypeDTO>> PostIncidentType([FromBody] IncidentTypeDTO incidentTypeDTO)
    {
        if (incidentTypeDTO == null)
        {
            return BadRequest("Incident Type data must be provided.");
        }
        IncidentTypeDTO? createdIncidentType = await _incidentTypeService.AddIncidentType(incidentTypeDTO, _errorMessages);
        if (createdIncidentType == null || _errorMessages.Any())
        {
            if (_errorMessages.Contains("already exists."))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }
        return CreatedAtAction(nameof(GetIncidentTypeById), new { id = createdIncidentType.Id }, createdIncidentType);
    }

    [HttpPut("Update/{code}")]
    public async Task<ActionResult> UpdateIncidentType(string code, IncidentTypeDTO incidentTypeDTO)
    {
        if (incidentTypeDTO == null)
        {
            return BadRequest("Incident Type data must be provided.");
        }
        bool updateResult = await _incidentTypeService.UpdateIncidentType(code, incidentTypeDTO, _errorMessages);
        if (!updateResult || _errorMessages.Any())
        {
            if (_errorMessages.Contains("not found."))
            {
                return NotFound(_errorMessages);
            }
            if (_errorMessages.Contains("already exists."))
            {
                return Conflict(_errorMessages);
            }
            return BadRequest(_errorMessages);
        }
        return Ok();
    }
}