namespace Application.Services;

using Domain.Model;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using Application.DTO;

public class DockService
{

    private readonly IDockRepository _dockRepository;
    private readonly IVesselTypeRepository _vesselTypeRepository;

    public DockService(IDockRepository dockRepository, IVesselTypeRepository vesselTypeRepository)
    {
        _dockRepository = dockRepository;
        _vesselTypeRepository = vesselTypeRepository;
    }

    public async Task<IEnumerable<DockDTO>> GetAllDocks()
    {
        IEnumerable<Dock> docks = await _dockRepository.GetDocksAsync();
        IEnumerable<DockDTO> dockDTOs = DockDTO.ToDTO(docks);
        return dockDTOs;
    }

    public async Task<DockDTO?> GetDockById(int id)
    {
        Dock? dock = await _dockRepository.GetDockByIdAsync(id);
        if (dock != null)
        {
            DockDTO dockDTO = DockDTO.ToDTO(dock);
            return dockDTO;
        }
        return null;
    }

    public async Task<DockDTO?> GetDockByName(string name)
    {
        Dock? dock = await _dockRepository.GetDockByNameAsync(name);
        if (dock != null)
        {
            DockDTO dockDTO = DockDTO.ToDTO(dock);
            return dockDTO;
        }
        return null;
    }

    public async Task<DockDTO?> GetDockByLocation(string location)
    {
        Dock? dock = await _dockRepository.GetDockByLocationAsync(location);
        if (dock != null)
        {
            DockDTO dockDTO = DockDTO.ToDTO(dock);
            return dockDTO;
        }
        return null;
    }

    public async Task<IEnumerable<DockDTO?>> GetDocksByVesselTypes(IEnumerable<long> vesselTypesIds)
    {
        if (vesselTypesIds == null || !vesselTypesIds.Any())
        {
            return Enumerable.Empty<DockDTO?>();
        }
        List<VesselType> vesselTypes = new List<VesselType>();
        foreach (long id in vesselTypesIds)
        {
            VesselType? vesselType = await _vesselTypeRepository.GetVesselTypeByIdAsync(id);
            if (vesselType != null)
            {
                vesselTypes.Add(vesselType);
            }
        }
        if (vesselTypes == null || !vesselTypes.Any())
        {
            return Enumerable.Empty<DockDTO?>();
        }

        IEnumerable<Dock?> docks = await _dockRepository.GetDocksByVesselTypesAsync(vesselTypes);
        if (docks == null || !docks.Any())
        {
            return Enumerable.Empty<DockDTO?>();
        }
        IEnumerable<DockDTO> dockDTOs = DockDTO.ToDTO(docks.Where(d => d != null)!);
        return dockDTOs;
    }

    public async Task<DockDTO?> AddDock(DockDTO dockDTO, List<string> errorMessages)
    {
        Dock? dock = await _dockRepository.GetDockByNameAsync(dockDTO.Name!);
        if (dock != null)
        {
            errorMessages.Add($"A dock with the name '{dockDTO.Name}' already exists.");
            return null;
        }
        Dock? dockByLocation = await _dockRepository.GetDockByLocationAsync(dockDTO.Location!);
        if (dockByLocation != null)
        {
            errorMessages.Add($"A dock with the location '{dockDTO.Location}' already exists.");
            return null;
        }
        try
        {
            dock = DockDTO.ToDomain(dockDTO);
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return null;
        }
        Dock dockSaved = await _dockRepository.AddDock(dock);
        DockDTO dDTO = DockDTO.ToDTO(dockSaved);
        return dDTO;
    }

    public async Task<bool> UpdateDock(string name, DockDTO dockDTO, List<string> errorMessages)
    {
        Dock? dock = await _dockRepository.GetDockByNameAsync(name);
        try
        {
            if (dock != null)
            {
                DockDTO.UpdateToDomain(dock, dockDTO);
                await _dockRepository.Update(dock, errorMessages);
                return true;
            }
            else
            {
                errorMessages.Add("Dock not found");
                return false;
            }

        }
        catch (Exception ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return false;
        }

    }




}