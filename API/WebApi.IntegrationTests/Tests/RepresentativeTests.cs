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
using Domain.Model;
using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;
using Microsoft.Build.Experimental.ProjectCache;

namespace WebApi.IntegrationTests.Tests
{
    public class RepresentativeTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public RepresentativeTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();

            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }

        [Fact]
        public async Task GetRepresentatives_ReturnsOkAndListOfRepresentatives()
        {
            var response = await _client.GetAsync("/api/Representative");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("rep1org1@email.com")]
        [InlineData("rep2org1@email.com")]
        public async Task GetRepresentativeByEmail_ExistingEmail_ReturnsOk(string email)
        {
            var response = await _client.GetAsync($"/api/Representative/ByEmail/{email}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("notemail@gmail.com")]
        public async Task GetRepresentativeByEmail_NonExistingEmail_ReturnsNotFound(string email)
        {
            var response = await _client.GetAsync($"/api/Representative/ByEmail/{email}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("911111111")]
        [InlineData("922222222")]
        public async Task GetRepresentativeByPhoneNumber_ExistingPhoneNumber_ReturnsOk(string phoneNumber)
        {
            var response = await _client.GetAsync($"/api/Representative/ByPhoneNumber/{phoneNumber}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("999999999")]
        [InlineData("000000000")]
        public async Task GetRepresentativeByPhoneNumber_NonExistingPhoneNumber_ReturnsNotFound(string phoneNumber)
        {
            var response = await _client.GetAsync($"/api/Representative/ByPhoneNumber/{phoneNumber}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("CID1")]
        [InlineData("CID2")]
        public async Task GetRepresentativeByCitizenId_ExistingId_ReturnsOk(string citizenId)
        {
            var response = await _client.GetAsync($"/api/Representative/ByCitizenId/{citizenId}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("CIT999")]
        [InlineData("CIT000")]
        public async Task GetRepresentativeById_NonExistingId_ReturnsNotFound(string citizenId)
        {
            var response = await _client.GetAsync($"/api/Representative/ByCitizenId/{citizenId}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("Rep1 Org1")]
        [InlineData("Rep2 Org1")]
        public async Task GetRepresentativeByName_ExistingName_ReturnsOk(string name)
        {
            var response = await _client.GetAsync($"/api/Representative/ByName/{name}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("NonExistentRep")]
        public async Task GetRepresentativeByName_NonExistingName_ReturnsNotFound(string name)
        {
            var response = await _client.GetAsync($"/api/Representative/ByName/{name}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("LegalName1")]
        [InlineData("LegalName2")]
        public async Task GetRepresentativeByOrganization_ExistingOrganization_ReturnsOk(string organizationName)
        {
            var response = await _client.GetAsync($"/api/Representative/ByOrganization/{organizationName}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("NonExistentCompany")]
        public async Task GetRepresentativeByOrganization_NonExistingOrganization_ReturnsNotFound(string organizationName)
        {
            var response = await _client.GetAsync($"/api/Representative/ByOrganization/{organizationName}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetRepresentativesById_Found()
        {
            var response = await _client.GetAsync("/api/Representative");
            response.EnsureSuccessStatusCode();
            var representatives = await response.Content.ReadFromJsonAsync<List<RepresentativeDTO>>();
            Assert.NotNull(representatives);
            Assert.NotEmpty(representatives);

            foreach (var rep in representatives)
            {
                var repResponse = await _client.GetAsync($"/api/Representative/ByID/{rep.Id}");
                Assert.Equal(HttpStatusCode.OK, repResponse.StatusCode);
                var returned = await repResponse.Content.ReadFromJsonAsync<RepresentativeDTO>();
                Assert.NotNull(returned);
                Assert.Equal(rep.Id, returned.Id);
            }

        }

        [Fact]
        public async Task GetRepresentativeById_NotFound()
        {
            var response = await _client.GetAsync("/api/Representative/ByID/9999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("LegalName1", "Test1", "PT", "test@gmail.com", "111111111")]
        [InlineData("LegalName2", "Test2", "PT", "test2@gmail.com", "222222222")]
        public async Task PutRepresentative_UpdatesSuccessfully(string organization, string name, string nationality, string email, string phoneNumber)
        {
            var response = await _client.GetAsync("/api/Representative/ByCitizenId/CID1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var representative = await response.Content.ReadFromJsonAsync<RepresentativeDTO>();
            Assert.NotNull(representative);

            representative.OrganizationName = organization;
            representative.Name = name;
            representative.Nationality = nationality;
            representative.Email = email;
            representative.PhoneNumber = phoneNumber;

            var putResponse = await _client.PutAsJsonAsync($"/api/Representative/Update/{representative.Id}", representative);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/Representative/ByID/{representative.Id}");
            if (getResponse.StatusCode != HttpStatusCode.OK)
            {
                var errorContent = await getResponse.Content.ReadAsStringAsync();
                throw new Xunit.Sdk.XunitException($"Expected OK but got {getResponse.StatusCode}. Response content: {errorContent}");
            }

            var returned = await getResponse.Content.ReadFromJsonAsync<RepresentativeDTO>();
            Assert.NotNull(returned);
            Assert.Equal(organization, returned.OrganizationName);
            Assert.Equal(name, returned.Name);
            Assert.Equal(nationality, returned.Nationality);
            Assert.Equal(email, returned.Email);
            Assert.Equal(phoneNumber, returned.PhoneNumber);
        }

        [Theory]
        [InlineData("CID1", "rep2org1@email.com")]
        [InlineData("CID2", "rep1org1@email.com")]
        public async Task PutRepresentative_DuplicateEmail_ReturnsBadConflict(string citizenId, string email)
        {
            var response = await _client.GetAsync($"/api/Representative/ByCitizenId/{citizenId}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var representative = await response.Content.ReadFromJsonAsync<RepresentativeDTO>();
            Assert.NotNull(representative);

            representative.Email = email;

            var putResponse = await _client.PutAsJsonAsync($"/api/Representative/Update/{representative.Id}", representative);
            Assert.Equal(HttpStatusCode.Conflict, putResponse.StatusCode);
        }

        [Theory]
        [InlineData("", "Test1", "PT", "test@gmail.com", "111111111")] // Empty organization
        [InlineData("Company1", "", "PT", "test@gmail.com", "111111111")] // Empty name
        [InlineData("Company1", "Test1", "", "test@gmail.com", "111111111")] // Empty nationality
        [InlineData("Company1", "Test1", "PT", "invalidemail", "111111111")] // Invalid email
        [InlineData("Company1", "Test1", "PT", "test@gmail.com", "invalidphone")] // Invalid phone number
        public async Task PutRepresentative_InvalidData_ReturnsBadRequest(string organization, string name, string nationality, string email, string phoneNumber)
        {
            var response = await _client.GetAsync("/api/Representative/ByCitizenId/CID1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var representative = await response.Content.ReadFromJsonAsync<RepresentativeDTO>();
            Assert.NotNull(representative);

            representative.OrganizationName = organization;
            representative.Name = name;
            representative.Nationality = nationality;
            representative.Email = email;
            representative.PhoneNumber = phoneNumber;

            var putResponse = await _client.PutAsJsonAsync($"/api/Representative/Update/{representative.Id}", representative);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Theory]
        [InlineData("LegalName1", "Rep1", "CIT789", "PT", "test3@test.com", "333333333")]
        [InlineData("LegalName2", "Rep2", "CIT101", "PT", "test4@gmail.com", "444444444")]
        [InlineData("LegalName1", "Rep3", "CIT112", "PT", "test5@gmail.com", "555555555")]
        public async Task PostRepresentative_ThenGetByName_ReturnsCreated(string organization, string name, string citizenId, string nationality, string email, string phoneNumber)
        {
            var newRepresentative = new RepresentativeDTO
            {
                OrganizationName = organization,
                Name = name,
                CitizenId = citizenId,
                Nationality = nationality,
                Email = email,
                PhoneNumber = phoneNumber
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Representative", newRepresentative);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/Representative/ByName/{name}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

            var returned = await getResponse.Content.ReadFromJsonAsync<RepresentativeDTO>();
            Assert.NotNull(returned);
            Assert.Equal(organization, returned.OrganizationName);
            Assert.Equal(name, returned.Name);
            Assert.Equal(citizenId, returned.CitizenId);
            Assert.Equal(nationality, returned.Nationality);
            Assert.Equal(email, returned.Email);
            Assert.Equal(phoneNumber, returned.PhoneNumber);
        }

        [Theory]
        [InlineData("LegalName1", "uniqueName", "CID1", "PT", "uniqueemail1@gmail.com", "666666666")]
        [InlineData("LegalName1", "uniqueName", "CID2", "PT", "uniqueemail2@gmail.com", "666666666")]
        public async Task PostRepresentative_DuplicateCitizenId_ReturnsConflict(string organization, string name, string citizenId, string nationality, string email, string phoneNumber)
        {
            var newRepresentative = new RepresentativeDTO
            {
                OrganizationName = organization,
                Name = name,
                CitizenId = citizenId,
                Nationality = nationality,
                Email = email,
                PhoneNumber = phoneNumber
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Representative", newRepresentative);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("LegalName1", "uniqueName", "U1", "PT", "rep1org1@email.com", "666666666")]
        [InlineData("LegalName1", "uniqueName", "U2", "PT", "rep2org1@email.com", "666666666")]
        public async Task PostRepresentative_DuplicateEmail_ReturnsConflict(string organization, string name, string citizenId, string nationality, string email, string phoneNumber)
        {
            var newRepresentative = new RepresentativeDTO
            {
                OrganizationName = organization,
                Name = name,
                CitizenId = citizenId,
                Nationality = nationality,
                Email = email,
                PhoneNumber = phoneNumber
            };
            var postResponse = await _client.PostAsJsonAsync("/api/Representative", newRepresentative);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("LegalName1", "uniqueName", "U1", "PT", "uniqueemail1@gmail.com", "911111111")]
        [InlineData("LegalName1", "uniqueName", "U2", "PT", "uniqueemail2@gmail.com", "922222222")]
        public async Task PostRepresentative_DuplicatePhoneNumber_ReturnsConflict(string organization, string name, string citizenId, string nationality, string email, string phoneNumber)
        {
            var newRepresentative = new RepresentativeDTO
            {
                OrganizationName = organization,
                Name = name,
                CitizenId = citizenId,
                Nationality = nationality,
                Email = email,
                PhoneNumber = phoneNumber
            };
            var postResponse = await _client.PostAsJsonAsync("/api/Representative", newRepresentative);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("", "Rep6", "CIT113", "PT", "test@gmail.com", "777777777")] // Empty organization
        [InlineData("Company1", "", "CIT113", "PT", "test@gmail.com", "777777777")] // Empty name
        [InlineData("Company1", "Rep6", "", "PT", "test@gmail.com", "777777777")] // Empty citizen ID
        [InlineData("Company1", "Rep6", "CIT113", "", "test@gmail.com", "777777777")] // Empty nationality
        [InlineData("Company1", "Rep6", "CIT113", "PT", "invalidemail", "777777777")] // Invalid email
        [InlineData("Company1", "Rep6", "CIT113", "PT", "test@gmail.com", "invalidphone")] // Invalid phone number
        public async Task PostRepresentative_InvalidData_ReturnsBadRequest(string organization, string name, string citizenId, string nationality, string email, string phoneNumber)
        {
            var newRepresentative = new RepresentativeDTO
            {
                OrganizationName = organization,
                Name = name,
                CitizenId = citizenId,
                Nationality = nationality,
                Email = email,
                PhoneNumber = phoneNumber
            };
            var postResponse = await _client.PostAsJsonAsync("/api/Representative", newRepresentative);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }
    }
}