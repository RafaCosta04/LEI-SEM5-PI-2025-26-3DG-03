using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using Domain.Model.Resources;
using Domain.Model;
using ShippingManagement.Domain.Qualifications;
using System.Collections.Generic;

namespace DataModel.Model
{
    public class PhysicalResourceDataModel
    {
        public long Id { get; set; }
        [Required]
        public string? Code { get; set; }
        [Required]
        public string? Name { get; set; }
        [Required]
        public string? Description { get; set; }
        [Required]
        public PhysicalResourceKind Kind { get; set; }
        public int? SetupTimeMinutes { get; set; }
        public int OperationalCapacity { get; set; }
        public string? AssignedStorageAreaCode { get; set; }
        public string? AssignedDockName { get; set; }
        [Required]
        public List<QualificationDataModel>? QualificationRequirements { get; set; }
        [Required]
        public DayOfWeek StartDay { get; set; }
        [Required]
        public DayOfWeek EndDay { get; set; }
        [Required]
        public TimeSpan StartTime { get; set; }
        [Required]
        public TimeSpan EndTime { get; set; }
        [Required]
        public ResourceStatus Status { get; set; }
        public PhysicalResourceDataModel() { }
        public PhysicalResourceDataModel(PhysicalResource resource)
        {
            Id = resource.Id;
            Code = resource.PhysicalResourceCode;
            Name = resource.Name;
            Description = resource.PhysicalResourceDescription;
            Kind = resource.PhysicalResourceKind;
            SetupTimeMinutes = resource.PhysicalResourceSetupTimeMinutes;
            OperationalCapacity = resource.PhysicalResourceOperationalCapacity;
            AssignedStorageAreaCode = resource.PhysicalResourceAssignedStorageAreaCode;
            AssignedDockName = resource.PhysicalResourceAssignedDockName;
            QualificationRequirements = resource.Qualification.Select(q => new QualificationDataModel(q)).ToList();
            StartDay = resource.OperationalWindow.StartDay;
            EndDay = resource.OperationalWindow.EndDay;
            StartTime = resource.OperationalWindow.StartTime;
            EndTime = resource.OperationalWindow.EndTime;
            Status = resource.Status;
        }
    }
}
