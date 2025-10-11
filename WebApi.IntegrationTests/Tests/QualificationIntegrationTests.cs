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

namespace WebApi.IntegrationTests.Tests
{

    public class QualificationIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public QualificationIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }

        [Fact]
        public async Task GetAllQualifications_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/Qualification");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("Aaaaaaa")]
        [InlineData("NonExistentQualification")]
        public async Task GetQualificationByName_NotFound(string name)
        {
            var response = await _client.GetAsync($"/api/Qualification/ByName/{name}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("First Qualification")]
        [InlineData("Second Qualification")]
        public async Task GetQualificationByName_Found(string name)
        {
            var response = await _client.GetAsync($"/api/Qualification/ByName/{name}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("QUAL1")]
        [InlineData("QUAL2")]
        public async Task GetQualificationByCode_Found(string code)
        {
            var response = await _client.GetAsync($"/api/Qualification/ByCode/{code}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("NonExistentCode")]
        public async Task GetQualificationByCode_NotFound(string code)
        {
            var response = await _client.GetAsync($"/api/Qualification/ByCode/{code}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task PostQualification_ThenGetByCode_ReturnsCreatedAndOk()
        {
            var dto = new QualificationDTO
            {
                Code = "NEWQUAL",
                Name = "New Qualification",
                Description = "Description of new qualification"
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Qualification", dto);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/Qualification/ByCode/{dto.Code}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

            var returnedDto = await getResponse.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(returnedDto);
            Assert.Equal(dto.Code, returnedDto!.Code);
            Assert.Equal(dto.Name, returnedDto.Name);
            Assert.Equal(dto.Description, returnedDto.Description);
        }

        [Fact]
        public async Task PostQualification_MissingCode_ReturnsBadRequest()
        {
            var dto = new QualificationDTO
            {
                Name = "No Code Qualification",
                Description = "This qualification has no code"
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Qualification", dto);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Fact]
        public async Task PostQualification_DuplicateCode_ReturnsBadRequest()
        {
            var dto = new QualificationDTO
            {
                Code = "QUAL1",
                Name = "Duplicate Code Qualification",
                Description = "This qualification has duplicate code"
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Qualification", dto);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Fact]
        public async Task PutQualification_UpdateNameAndDescription_ReturnsOk()
        {

            var createDto = new QualificationDTO
            {
                Code = "UPDQUAL",
                Name = "Qualification to Update",
                Description = "Initial Description Here"
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Qualification", createDto);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var createdDto = await postResponse.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(createdDto);


            var updateDto = new QualificationDTO
            {
                Name = "Updated Qualification Name",
                Description = "Updated Description Here"
            };

            var putResponse = await _client.PutAsJsonAsync($"/api/Qualification/Update/{createdDto!.Id}", updateDto);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);


            var getResponse = await _client.GetAsync($"/api/Qualification/ByCode/{createDto.Code}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

            var updatedDto = await getResponse.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(updatedDto);
            Assert.Equal(updateDto.Name, updatedDto!.Name);
            Assert.Equal(updateDto.Description, updatedDto.Description);
        }

        [Fact]
        public async Task PutQualification_NonExistentId_ReturnsNotFound()
        {
            var updateDto = new QualificationDTO
            {
                Name = "NonExistent Name",
                Description = "Trying to update non-existent qualification"
            };

            var putResponse = await _client.PutAsJsonAsync($"/api/Qualification/Update/9999", updateDto);
            Assert.Equal(HttpStatusCode.NotFound, putResponse.StatusCode);
        }

        [Fact]
        public async Task PutQualification_NullDto_ReturnsBadRequest()
        {
            var putResponse = await _client.PutAsJsonAsync($"/api/Qualification/Update/1", (QualificationDTO?)null);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

    }
}
