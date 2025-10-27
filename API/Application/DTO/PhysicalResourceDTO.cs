using Domain.Model.Resources;
using Domain.Model;
using ShippingManagement.Domain.Qualifications;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Application.DTO
{
    public class PhysicalResourceDTO
    {
        public long? Id { get; set; }
        [System.ComponentModel.DataAnnotations.Required]
        public string Code { get; set; } = string.Empty;
        [System.ComponentModel.DataAnnotations.Required]
        public string Name { get; set; } = string.Empty;
        [System.ComponentModel.DataAnnotations.Required]
        public string Description { get; set; } = string.Empty;
        [System.ComponentModel.DataAnnotations.Required]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public PhysicalResourceKind Kind { get; set; }
        [System.ComponentModel.DataAnnotations.Required]
        public int SetupTimeMinutes { get; set; }
        [System.ComponentModel.DataAnnotations.Required]
        public int OperationalCapacity { get; set; }
        [System.ComponentModel.DataAnnotations.Required]
        public string AssignedArea { get; set; } = string.Empty;
        [System.ComponentModel.DataAnnotations.Required]
        public string QualificationCode { get; set; } = string.Empty;
        [System.ComponentModel.DataAnnotations.Required]
        public OperationalWindowDTO? OperationalWindow { get; set; }
        [System.ComponentModel.DataAnnotations.Required]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public ResourceStatus Status { get; set; }

        public PhysicalResourceDTO() { }

        public static PhysicalResourceDTO ToDTO(PhysicalResource resource)
        {
            return new PhysicalResourceDTO
            {
                Id = resource.Id,
                Code = resource.PhysicalResourceCode,
                Name = resource.Name,
                Description = resource.PhysicalResourceDescription,
                Kind = resource.PhysicalResourceKind,
                SetupTimeMinutes = resource.PhysicalResourceSetupTimeMinutes ?? 0,
                OperationalCapacity = resource.PhysicalResourceOperationalCapacity,
                AssignedArea = (resource.PhysicalResourceAssignedStorageAreaCode ?? resource.PhysicalResourceAssignedDockName) ?? string.Empty,
                QualificationCode = resource.Qualification?.FirstOrDefault()?.Code ?? string.Empty,
                OperationalWindow = OperationalWindowDTO.ToDTO(resource.OperationalWindow),
                Status = resource.Status
            };
        }
    }
}
