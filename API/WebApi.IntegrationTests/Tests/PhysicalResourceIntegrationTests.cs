using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;
using WebApi;
using Application.DTO;
using Microsoft.AspNetCore.Mvc.Testing;
using DataModel.Repository;
using WebApi.IntegrationTests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Domain.Model.Resources;
using Domain.Model;

namespace WebApi.IntegrationTests.Tests
{
    public class PhysicalResourceIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public PhysicalResourceIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }

        [Fact]
        public async Task GetAllPhysicalResources_ReturnsOkAndList()
        {
            var response = await _client.GetAsync("/api/PhysicalResources");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var resources = await response.Content.ReadFromJsonAsync<List<PhysicalResourceDTO>>();
            Assert.NotNull(resources);
            Assert.True(resources.Count >= 3);
        }

        [Theory]
        [InlineData("NONEXIST")]
        [InlineData("INVALID")]
        public async Task GetPhysicalResourceByCode_NotFound(string code)
        {
            var response = await _client.GetAsync($"/api/PhysicalResources/ByCode/{code}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("STS001")]
        [InlineData("MBL001")]
        [InlineData("TRUCK001")]
        public async Task GetPhysicalResourceByCode_Found_ReturnsOk(string code)
        {
            var response = await _client.GetAsync($"/api/PhysicalResources/ByCode/{code}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var resource = await response.Content.ReadFromJsonAsync<PhysicalResourceDTO>();
            Assert.NotNull(resource);
            Assert.Equal(code, resource.Code);
        }

        [Theory]
        [InlineData("NonExistingDescription")]
        [InlineData("Invalid Description")]
        public async Task GetPhysicalResourceByDescription_NotFound(string description)
        {
            var response = await _client.GetAsync($"/api/PhysicalResources/ByDescription/{description}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("Crane")]
        [InlineData("truck")]
        [InlineData("cargo")]
        public async Task GetPhysicalResourceByDescription_Found(string description)
        {
            var response = await _client.GetAsync($"/api/PhysicalResources/ByDescription/{description}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var resources = await response.Content.ReadFromJsonAsync<List<PhysicalResourceDTO>>();
            Assert.NotNull(resources);
            Assert.NotEmpty(resources);
        }

        [Theory]
        [InlineData(PhysicalResourceKind.STSCrane)]
        [InlineData(PhysicalResourceKind.MobileCrane)]
        [InlineData(PhysicalResourceKind.Truck)]
        public async Task GetPhysicalResourceByKind_Found(PhysicalResourceKind kind)
        {
            var response = await _client.GetAsync($"/api/PhysicalResources/ByKind/{kind}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var resources = await response.Content.ReadFromJsonAsync<List<PhysicalResourceDTO>>();
            Assert.NotNull(resources);
            Assert.NotEmpty(resources);
            Assert.All(resources, r => Assert.Equal(kind, r.Kind));
        }

        [Fact]
        public async Task GetPhysicalResourceByStatus_Available_ReturnsOkAndList()
        {
            var response = await _client.GetAsync($"/api/PhysicalResources/ByStatus/{ResourceStatus.Available}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var resources = await response.Content.ReadFromJsonAsync<List<PhysicalResourceDTO>>();
            Assert.NotNull(resources);
            Assert.NotEmpty(resources);
            Assert.All(resources, r => Assert.Equal(ResourceStatus.Available, r.Status));
        }

        [Fact]
        public async Task PostPhysicalResource_ValidData_ReturnsCreatedAndOK()
        {
            var newResource = new PhysicalResourceDTO
            {
                Code = "PR004",
                Name = "Test Crane Delta",
                Description = "Test crane for integration testing purposes with detailed description",
                Kind = PhysicalResourceKind.STSCrane,
                SetupTimeMinutes = 20,
                OperationalCapacity = 40,
                AssignedArea = "Dock A",
                QualificationCode = "QUAL1",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/PhysicalResources", newResource);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var createdResource = await postResponse.Content.ReadFromJsonAsync<PhysicalResourceDTO>();
            Assert.NotNull(createdResource);
            Assert.Equal(newResource.Code, createdResource.Code);
            Assert.Equal(newResource.Name, createdResource.Name);
            Assert.Equal(newResource.Description, createdResource.Description);
            Assert.Equal(newResource.Kind, createdResource.Kind);

            var getResponse = await _client.GetAsync($"/api/PhysicalResources/ByCode/{newResource.Code}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        }

        [Theory]
        [InlineData("STS001", "Duplicate Code Test", "Valid description for duplicate code test")]
        [InlineData("MBL001", "Another Duplicate", "Another valid description for duplicate code")]
        [InlineData("TRUCK001", "Third Duplicate", "Third valid description for duplicate code")]
        public async Task PostPhysicalResource_DuplicateCode_ReturnsConflict(string code, string name, string description)
        {
            var duplicateResource = new PhysicalResourceDTO
            {
                Code = code,
                Name = name,
                Description = description,
                Kind = PhysicalResourceKind.Truck,
                SetupTimeMinutes = 10,
                OperationalCapacity = 20,
                AssignedArea = "WH001",
                QualificationCode = "QUAL1",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "08:00",
                    EndTime = "16:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/PhysicalResources", duplicateResource);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("", "Valid Name", "Valid description with multiple words")]
        [InlineData(null, "Valid Name", "Valid description with multiple words")]
        [InlineData("   ", "Valid Name", "Valid description with multiple words")]
        [InlineData("TOOLONGCODE1234567890", "Valid Name", "Valid description with multiple words")]
        [InlineData("CODE@#$", "Valid Name", "Valid description with multiple words")]
        public async Task PostPhysicalResource_InvalidCode_ReturnsBadRequest(string? code, string name, string description)
        {
            var invalidResource = new PhysicalResourceDTO
            {
                Code = code ?? string.Empty,
                Name = name,
                Description = description,
                Kind = PhysicalResourceKind.Truck,
                SetupTimeMinutes = 10,
                OperationalCapacity = 20,
                AssignedArea = "WH001",
                QualificationCode = "QUAL1",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "08:00",
                    EndTime = "16:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/PhysicalResources", invalidResource);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("VALID1", "", "Valid description with multiple words")]
        [InlineData("VALID2", null, "Valid description with multiple words")]
        [InlineData("VALID3", "   ", "Valid description with multiple words")]
        public async Task PostPhysicalResource_InvalidName_ReturnsBadRequest(string code, string? name, string description)
        {
            var invalidResource = new PhysicalResourceDTO
            {
                Code = code,
                Name = name ?? string.Empty,
                Description = description,
                Kind = PhysicalResourceKind.Truck,
                SetupTimeMinutes = 10,
                OperationalCapacity = 20,
                AssignedArea = "WH001",
                QualificationCode = "QUAL1",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "08:00",
                    EndTime = "16:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/PhysicalResources", invalidResource);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("VALID6", "Valid Name", "")]
        [InlineData("VALID7", "Valid Name", null)]
        [InlineData("VALID8", "Valid Name", "   ")]
        [InlineData("VALID9", "Valid Name", "Short")]
        public async Task PostPhysicalResource_InvalidDescription_ReturnsBadRequest(string code, string name, string? description)
        {
            var invalidResource = new PhysicalResourceDTO
            {
                Code = code,
                Name = name,
                Description = description ?? string.Empty,
                Kind = PhysicalResourceKind.Truck,
                SetupTimeMinutes = 10,
                OperationalCapacity = 20,
                AssignedArea = "WH001",
                QualificationCode = "QUAL1",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "08:00",
                    EndTime = "16:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/PhysicalResources", invalidResource);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(-100)]
        public async Task PostPhysicalResource_InvalidOperationalCapacity_ReturnsBadRequest(int capacity)
        {
            var invalidResource = new PhysicalResourceDTO
            {
                Code = "VALID10",
                Name = "Valid Name",
                Description = "Valid description with multiple words for testing purposes",
                Kind = PhysicalResourceKind.Truck,
                SetupTimeMinutes = 10,
                OperationalCapacity = capacity,
                AssignedArea = "WH001",
                QualificationCode = "QUAL1",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "08:00",
                    EndTime = "16:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/PhysicalResources", invalidResource);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Fact]
        public async Task PutPhysicalResource_UpdatesSuccessfully()
        {
            var response = await _client.GetAsync("/api/PhysicalResources/ByCode/STS001");
            var resource = await response.Content.ReadFromJsonAsync<PhysicalResourceDTO>();
            Assert.NotNull(resource);
            Assert.Equal("STS001", resource.Code);

            resource.Name = "Updated STS Crane Alpha";
            resource.Description = "Updated description for STS Crane Alpha with detailed information";
            resource.OperationalCapacity = 60;

            var putResponse = await _client.PutAsJsonAsync($"/api/PhysicalResources/Update/{resource.Id}", resource);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/PhysicalResources/ByCode/{resource.Code}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var updatedResource = await getResponse.Content.ReadFromJsonAsync<PhysicalResourceDTO>();
            Assert.NotNull(updatedResource);
            Assert.Equal("Updated STS Crane Alpha", updatedResource.Name);
            Assert.Equal("Updated description for STS Crane Alpha with detailed information", updatedResource.Description);
            Assert.Equal(60, updatedResource.OperationalCapacity);
        }

        [Fact]
        public async Task PutPhysicalResource_ChangeCode_ReturnsBadRequest()
        {
            var response = await _client.GetAsync("/api/PhysicalResources/ByCode/STS001");
            var resource = await response.Content.ReadFromJsonAsync<PhysicalResourceDTO>();
            Assert.NotNull(resource);
            Assert.Equal("STS001", resource.Code);

            resource.Code = "NEWCODE";
            resource.Name = "Updated Name";
            resource.Description = "Updated description with multiple words for testing";

            var putResponse = await _client.PutAsJsonAsync($"/api/PhysicalResources/Update/{resource.Id}", resource);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Theory]
        [InlineData("", "Valid description with multiple words for testing")]
        [InlineData(null, "Valid description with multiple words for testing")]
        [InlineData("   ", "Valid description with multiple words for testing")]
        public async Task PutPhysicalResource_InvalidName_ReturnsBadRequest(string? name, string description)
        {
            var response = await _client.GetAsync("/api/PhysicalResources/ByCode/MBL001");
            var resource = await response.Content.ReadFromJsonAsync<PhysicalResourceDTO>();
            Assert.NotNull(resource);
            Assert.Equal("MBL001", resource.Code);

            resource.Name = name ?? string.Empty;
            resource.Description = description;

            var putResponse = await _client.PutAsJsonAsync($"/api/PhysicalResources/Update/{resource.Id}", resource);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Theory]
        [InlineData("Valid Name", "")]
        [InlineData("Valid Name", null)]
        [InlineData("Valid Name", "   ")]
        [InlineData("Valid Name", "Short")]
        public async Task PutPhysicalResource_InvalidDescription_ReturnsBadRequest(string name, string? description)
        {
            var response = await _client.GetAsync("/api/PhysicalResources/ByCode/TRUCK001");
            var resource = await response.Content.ReadFromJsonAsync<PhysicalResourceDTO>();
            Assert.NotNull(resource);
            Assert.Equal("TRUCK001", resource.Code);

            resource.Name = name;
            resource.Description = description ?? string.Empty;

            var putResponse = await _client.PutAsJsonAsync($"/api/PhysicalResources/Update/{resource.Id}", resource);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Theory]
        [InlineData(-5)]
        [InlineData(-100)]
        public async Task PutPhysicalResource_InvalidOperationalCapacity_ReturnsBadRequest(int capacity)
        {
            var response = await _client.GetAsync("/api/PhysicalResources/ByCode/STS001");
            var resource = await response.Content.ReadFromJsonAsync<PhysicalResourceDTO>();
            Assert.NotNull(resource);
            Assert.Equal("STS001", resource.Code);

            resource.Name = "Valid Updated Name";
            resource.Description = "Valid updated description with multiple words for testing purposes";
            resource.OperationalCapacity = capacity;

            var putResponse = await _client.PutAsJsonAsync($"/api/PhysicalResources/Update/{resource.Id}", resource);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }
    }
}
