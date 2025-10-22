using DataModel.Model;
using Domain.Model.Resources;
using Domain.Factory;
using System.Collections.Generic;
using System.Linq;

namespace DataModel.Mapper
{
    public class PhysicalResourceMapper
    {
        private readonly IPhysicalResourceFactory _factory;
        private readonly QualificationMapper _qualificationMapper;

        public PhysicalResourceMapper(IPhysicalResourceFactory factory, QualificationMapper qualificationMapper)
        {
            _factory = factory;
            _qualificationMapper = qualificationMapper;
        }

        public PhysicalResource ToDomain(PhysicalResourceDataModel dm)
        {
            var quals = (dm.QualificationRequirements ?? Enumerable.Empty<QualificationDataModel>()).Select(q => _qualificationMapper.ToDomain(q)).ToList();
            var resource = _factory.NewPhysicalResource(dm.Code!, dm.Name!, dm.Description!, dm.Kind, quals, dm.OperationalCapacity, dm.AssignedArea, dm.SetupTimeMinutes);
            resource.Id = dm.Id;
            if (!dm.IsActive) resource.Deactivate();
            return resource;
        }

        public PhysicalResourceDataModel ToDataModel(PhysicalResource resource)
        {
            return new PhysicalResourceDataModel(resource);
        }

        public void UpdateDataModel(PhysicalResourceDataModel dm, PhysicalResource resource)
        {
            dm.Name = resource.Name;
            dm.Description = resource.PhysicalResourceDescription;
            dm.Kind = resource.PhysicalResourceKind;
            dm.SetupTimeMinutes = resource.PhysicalResourceSetupTimeMinutes;
            dm.OperationalCapacity = resource.PhysicalResourceOperationalCapacity;
            dm.AssignedArea = resource.PhysicalResourceAssignedArea;
            dm.IsActive = resource.PhysicalResourceIsActive;
            dm.DeactivatedAt = resource.PhysicalResourceDeactivatedAt;
        }
    }
}
