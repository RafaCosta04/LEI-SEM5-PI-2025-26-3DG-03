using ShippingManagement.Domain.Qualifications;

namespace DataModel.Model;

public class QualificationDataModel
{
    public long Id { get; set; }
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }

    public QualificationDataModel() { }

    public QualificationDataModel(Qualification qualification)
    {
        Id = qualification.Id;
        Code = qualification.Code;
        Name = qualification.Name;
        Description = qualification.Description;
    }
}
