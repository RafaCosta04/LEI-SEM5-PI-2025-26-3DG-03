using Domain.IRepository;
using Domain.Model.Resources;
using Domain.Model;
using Application.DTO;
using Domain.Factory;
using ShippingManagement.Domain.Qualifications;
using System.Collections.Generic;
using System.Linq;

namespace Application.Services
{
    public class PhysicalResourceService
    {
        private readonly IPhysicalResourceRepository _repo;
        private readonly IQualificationRepository _qualificationRepository;
        private readonly IPhysicalResourceFactory _factory;

        public PhysicalResourceService(IPhysicalResourceRepository repo, IQualificationRepository qualificationRepository, IPhysicalResourceFactory factory)
        {
            _repo = repo;
            _qualificationRepository = qualificationRepository;
            _factory = factory;
        }

        public async Task<IEnumerable<PhysicalResourceDTO>> GetAll()
        {
            var resources = await _repo.GetAllPhysicalResourcesAsync();
            return resources.Select(r => PhysicalResourceDTO.ToDTO(r));
        }

        public async Task<PhysicalResourceDTO?> GetById(long id)
        {
            var r = await _repo.GetPhysicalResourceByIdAsync(id);
            return r == null ? null : PhysicalResourceDTO.ToDTO(r);
        }

        public async Task<PhysicalResourceDTO?> GetByCode(string code)
        {
            var r = await _repo.GetPhysicalResourceByCodeAsync(code);
            return r == null ? null : PhysicalResourceDTO.ToDTO(r);
        }

        public async Task<IEnumerable<PhysicalResourceDTO>> Search(string? code = null, string? name = null, string? description = null, PhysicalResourceKind? kind = null, ResourceStatus? status = null)
        {
            var result = await _repo.SearchAsync(code, name, description, kind, status);
            return result.Select(r => PhysicalResourceDTO.ToDTO(r));
        }

        public async Task<PhysicalResourceDTO?> Add(PhysicalResourceDTO dto, List<string> errorMessages)
        {
            // Validate unique code
            var existing = await _repo.GetPhysicalResourceByCodeAsync(dto.Code);
            if (existing != null)
            {
                errorMessages.Add($"A resource with code '{dto.Code}' already exists.");
                return null;
            }

            IEnumerable<Qualification> qualifications = Enumerable.Empty<Qualification>();
            if (dto.QualificationCodes != null && dto.QualificationCodes.Any())
            {
                qualifications = await _qualificationRepository.GetQualificationsByCodesAsync(dto.QualificationCodes);
            }

            try
            {
                var resource = _factory.NewPhysicalResource(dto.Code, dto.Name, dto.Description, dto.Kind, qualifications, dto.OperationalCapacity, dto.AssignedArea, dto.SetupTimeMinutes == 0 ? null : (int?)dto.SetupTimeMinutes);
                var saved = await _repo.AddPhysicalResource(resource);
                return PhysicalResourceDTO.ToDTO(saved);
            }
            catch (Exception ex)
            {
                errorMessages.Add("Error creating resource: " + ex.Message);
                return null;
            }
        }

        public async Task<bool> Update(long id, PhysicalResourceDTO dto, List<string> errorMessages)
        {
            var resource = await _repo.GetPhysicalResourceByIdAsync(id);
            if (resource == null)
            {
                errorMessages.Add("Resource not found");
                return false;
            }

            // If code changes, ensure uniqueness
            if (!string.Equals(resource.PhysicalResourceCode, dto.Code, StringComparison.OrdinalIgnoreCase))
            {
                var byCode = await _repo.GetPhysicalResourceByCodeAsync(dto.Code!);
                if (byCode != null && byCode.Id != id)
                {
                    errorMessages.Add($"A resource with code '{dto.Code}' already exists.");
                    return false;
                }
            }

            try
            {
                // apply changes
                resource.ChangeName(dto.Name);
                resource.ChangeDescription(dto.Description);
                resource.ChangeKind(dto.Kind);
                resource.ChangeOperationalCapacity(dto.OperationalCapacity);
                resource.ChangeAssignedArea(string.IsNullOrWhiteSpace(dto.AssignedArea) ? null : dto.AssignedArea);
                resource.ChangeSetupTime(dto.SetupTimeMinutes == 0 ? null : (int?)dto.SetupTimeMinutes);

                if (dto.QualificationCodes != null && dto.QualificationCodes.Any())
                {
                    var quals = await _qualificationRepository.GetQualificationsByCodesAsync(dto.QualificationCodes);
                    resource.ChangeQualificationRequirements(quals);
                }

                if (!dto.IsActive && resource.PhysicalResourceIsActive) resource.Deactivate();
                if (dto.IsActive && !resource.PhysicalResourceIsActive) resource.Reactivate();

                await _repo.Update(resource, errorMessages);
                return true;
            }
            catch (Exception ex)
            {
                errorMessages.Add("Error updating resource: " + ex.Message);
                return false;
            }
        }
    }
}
