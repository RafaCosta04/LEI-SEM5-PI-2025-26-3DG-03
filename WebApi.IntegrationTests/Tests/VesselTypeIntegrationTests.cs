using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;
using WebApi;
using Application.DTO;
using Microsoft.AspNetCore.Mvc.Testing;

namespace WebApi.IntegrationTests.Tests
{
    public class VesselTypeIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public VesselTypeIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetAllVesselTypes_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/VesselType");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task PostVesselType_ThenGetByName_ReturnsCreatedAndOk()
        {
            var dto = new VesselTypeDTO
            {
                Name = "TestType",
                Description = "TestDesc",
                Capacity = 100,
                MaxRows = 10,
                MaxBays = 5,
                MaxTiers = 3
            };
            var postResponse = await _client.PostAsJsonAsync("/api/VesselType", dto);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/VesselType/ByName/{dto.Name}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var returned = await getResponse.Content.ReadFromJsonAsync<VesselTypeDTO>();
            Assert.NotNull(returned);
            Assert.Equal(dto.Name, returned.Name);
        }

        [Fact]
        public async Task PutVesselType_UpdatesSuccessfully()
        {
            var dto = new VesselTypeDTO
            {
                Name = "UpdateType",
                Description = "Desc",
                Capacity = 100,
                MaxRows = 10,
                MaxBays = 5,
                MaxTiers = 3
            };
            await _client.PostAsJsonAsync("/api/VesselType", dto);

            dto.Description = "UpdatedDesc";
            var putResponse = await _client.PutAsJsonAsync($"/api/VesselType/Update/{dto.Name}", dto);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/VesselType/ByName/{dto.Name}");
            var returned = await getResponse.Content.ReadFromJsonAsync<VesselTypeDTO>();
            Assert.NotNull(returned);
            Assert.Equal("UpdatedDesc", returned.Description);
        }

        [Fact]
        public async Task GetVesselTypeById_NotFound()
        {
            var response = await _client.GetAsync("/api/VesselType/ByID/99999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
