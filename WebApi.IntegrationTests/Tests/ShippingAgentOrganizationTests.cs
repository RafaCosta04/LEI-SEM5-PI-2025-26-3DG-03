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
    public class ShippingAgentOrganizationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public ShippingAgentOrganizationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();

            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }

        [Fact]
        public async Task GetAllShippingAgentOrganizations_ReturnsOkAndList()
        {
            var response = await _client.GetAsync("/api/ShippingAgentOrganization");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("AAA1")]
        [InlineData("BBB2")]
        public async Task GetShippingAgentOrganizationByCode_ExistingCode_ReturnsOk(string code)
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/{code}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetShippingAgentOrganizationByCode_NonExistingCode_ReturnsNotFound()
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/INVALID_CODE");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetShippingAgentOrganizationById_Found()
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization");
            response.EnsureSuccessStatusCode();
            var organizations = await response.Content.ReadFromJsonAsync<IEnumerable<ShippingAgentOrganizationDTO>>();
            Assert.NotNull(organizations);
            Assert.NotEmpty(organizations);
            foreach (var org in organizations)
            {
                var getByIdResponse = await _client.GetAsync($"/api/ShippingAgentOrganization/ByID/{org.Id}");
                Assert.Equal(HttpStatusCode.OK, getByIdResponse.StatusCode);
                var returnedOrg = await getByIdResponse.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
                Assert.NotNull(returnedOrg);
                Assert.Equal(org.Id, returnedOrg.Id);
            }
        }

        [Fact]
        public async Task GetShippingAgentOrganizationById_NotFound()
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByID/9999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("LegalName1")]
        [InlineData("LegalName2")]
        public async Task GetShippingAgentOrganizationByLegalName_ExistingName_ReturnsOk(string legalName)
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByLegalName/{legalName}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetShippingAgentOrganizationByLegalName_NonExistingName_ReturnsNotFound()
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByLegalName/NonExistent Legal Name");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("AltName1")]
        [InlineData("AltName2")]
        public async Task GetShippingAgentOrganizationByAlternativeName_ExistingName_ReturnsOk(string alternativeName)
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByAlternativeName/{alternativeName}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetShippingAgentOrganizationByAlternativeName_NonExistingName_ReturnsNotFound()
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByAlternativeName/NonExistent Alternative Name");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("TaxNumber1")]
        [InlineData("TaxNumber2")]
        public async Task GetShippingAgentOrganizationByTaxNumber_ExistingTaxNumber_ReturnsOk(string taxNumber)
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByTaxNumber/{taxNumber}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetShippingAgentOrganizationByTaxNumber_NonExistingTaxNumber_ReturnsNotFound()
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByTaxNumber/NONEXISTENTTAX");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("Test 1", "Test road 1", "789 tests", "TAX789012")]
        [InlineData("Test 2", "Test road 2", "321 tests", "TAX210987")]
        public async Task PutShippingAgentOrganization_UpdatesSuccessfully(string legalName, string alternativeName, string address, string taxNumber)
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/AAA1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var org = await response.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
            Assert.NotNull(org);

            org.LegalName = legalName;
            org.AlternativeName = alternativeName;
            org.Address = address;
            org.TaxNumber = taxNumber;

            var putResponse = await _client.PutAsJsonAsync($"/api/ShippingAgentOrganization/Update/{org.Id}", org);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/ShippingAgentOrganization/ByID/{org.Id}");
            if (getResponse.StatusCode != HttpStatusCode.OK)
            {
                var errorContent = await getResponse.Content.ReadAsStringAsync();
                throw new Xunit.Sdk.XunitException($"Failed to retrieve updated organization. Status Code: {getResponse.StatusCode}, Content: {errorContent}");
            }
            var returnedOrg = await getResponse.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
            Assert.NotNull(returnedOrg);
            Assert.Equal(legalName, returnedOrg.LegalName);
            Assert.Equal(alternativeName, returnedOrg.AlternativeName);
            Assert.Equal(address, returnedOrg.Address);
            Assert.Equal(taxNumber, returnedOrg.TaxNumber);
        }

        [Fact]
        public async Task PutShippingAgentOrganization_DuplicateCode_ReturnsConflict()
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/AAA1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var org = await response.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
            Assert.NotNull(org);
            org.Code = "BBB2";
            var putResponse = await _client.PutAsJsonAsync($"/api/ShippingAgentOrganization/Update/{org.Id}", org);
            Assert.Equal(HttpStatusCode.Conflict, putResponse.StatusCode);
        }


        [Fact]
        public async Task PutShippingAgentOrganization_DuplicateLegalName_ReturnsConflict()
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/AAA1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var org = await response.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
            Assert.NotNull(org);
            org.LegalName = "LegalName2";
            var putResponse = await _client.PutAsJsonAsync($"/api/ShippingAgentOrganization/Update/{org.Id}", org);
            Assert.Equal(HttpStatusCode.Conflict, putResponse.StatusCode);
        }

        [Fact]
        public async Task PutShippingAgentOrganization_DuplicateTaxNumber_ReturnsConflict()
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/AAA1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var org = await response.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
            Assert.NotNull(org);
            org.TaxNumber = "TaxNumber2";
            var putResponse = await _client.PutAsJsonAsync($"/api/ShippingAgentOrganization/Update/{org.Id}", org);
            Assert.Equal(HttpStatusCode.Conflict, putResponse.StatusCode);
        }

        [Fact]
        public async Task PutShippingAgentOrganization_DuplicateAddress_ReturnsConflict()
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/AAA1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var org = await response.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
            Assert.NotNull(org);
            org.Address = "Address2";
            var putResponse = await _client.PutAsJsonAsync($"/api/ShippingAgentOrganization/Update/{org.Id}", org);
            Assert.Equal(HttpStatusCode.Conflict, putResponse.StatusCode);
        }

        [Theory]
        [InlineData("", "TEST", "test", "999 New Address", "NEW123456")] // Empty Code
        [InlineData("INVALID CODE!", "Valid Legal Name", "test", "999 New Address", "NEW123456")] // Invalid Code with special characters
        [InlineData("VALIDCODE", "", "test", "999 New Address", "NEW123456")] // Empty LegalName
        [InlineData("VALIDCODE", "Valid Legal Name", "", "999 New Address", "NEW123456")] // Empty AlternativeName
        [InlineData("VALIDCODE", "Valid Legal Name", "test", "", "NEW123456")] // Empty Address
        [InlineData("VALIDCODE", "Valid Legal Name", "test", "999 New Address", "")] // Empty TaxNumber

        public async Task PutShippingAgentOrganization_InvalidData_ReturnsBadRequest(string? code, string? legalName, string? alternativeName, string? address, string? taxNumber)
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/AAA1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var org = await response.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
            Assert.NotNull(org);

            org.Code = code;
            org.LegalName = legalName;
            org.AlternativeName = alternativeName;
            org.Address = address;
            org.TaxNumber = taxNumber;

            var putResponse = await _client.PutAsJsonAsync($"/api/ShippingAgentOrganization/Update/{org.Id}", org);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Theory]
        [InlineData("SA003", "Test1", "T1", "Test1 St", "TAX001")]
        [InlineData("SA004", "Test2", "T2", "Test2 St", "TAX002")]
        public async Task PostShippingAgentOrganization_CreatesSuccessfully(string code, string legalName, string alternativeName, string address, string taxNumber)
        {
            var newOrg = new ShippingAgentOrganizationWithRepresentativeDTO
            {
                Code = code,
                LegalName = legalName,
                AlternativeName = alternativeName,
                Address = address,
                TaxNumber = taxNumber,
                RepresentativeName = $"Rep1",
                RepresentativeCitizenId = $"REP123",
                RepresentativeNationality = "PT",
                RepresentativeEmail = $"rep@test.com",
                RepresentativePhoneNumber = "123456789"
            };

            var postResponse = await _client.PostAsJsonAsync($"/api/ShippingAgentOrganization", newOrg);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/{code}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

            var createdOrg = await postResponse.Content.ReadFromJsonAsync<ShippingAgentOrganizationWithRepresentativeDTO>();
            Assert.NotNull(createdOrg);
            Assert.Equal(code, createdOrg.Code);
            Assert.Equal(legalName, createdOrg.LegalName);
            Assert.Equal(alternativeName, createdOrg.AlternativeName);
            Assert.Equal(address, createdOrg.Address);
            Assert.Equal(taxNumber, createdOrg.TaxNumber);
        }

        [Theory]
        [InlineData("AAA1", "Dup Test", "Dup1", "123 Ocean Drive", "TAX123456", "Test1", "TEST1", "PT", "test@gmail.com", "123456789")]
        [InlineData("BBB2", "Dup Test2", "Dup2", "456 Harbor Street", "TAX654321", "Test2", "TEST2", "PT", "test2@gmail.com", "987654321")]
        public async Task PostShippingAgentOrganization_DuplicateCode_ReturnsConflict(string code, string legalName, string alternativeName, string address, string taxNumber, string repName, string repCitizenId, string repNationality, string repEmail, string repPhone)
        {
            var newOrg = new ShippingAgentOrganizationWithRepresentativeDTO
            {
                Code = code,
                LegalName = legalName,
                AlternativeName = alternativeName,
                Address = address,
                TaxNumber = taxNumber,
                RepresentativeName = repName,
                RepresentativeCitizenId = repCitizenId,
                RepresentativeNationality = repNationality,
                RepresentativeEmail = repEmail,
                RepresentativePhoneNumber = repPhone
            };

            var postResponse = await _client.PostAsJsonAsync($"/api/ShippingAgentOrganization", newOrg);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("UNIQUECODE", "LegalName1", "Unique SA", "789 New Harbor St", "TAX789012", "Test1", "TEST1", "PT", "test@gmail.com", "123456789")]
        [InlineData("ANOTHERCODE", "LegalName2", "Another SA", "101 New Dock Rd", "TAX345678", "Test2", "TEST2", "PT", "test2@gmail.com", "123456782")]
        public async Task PostShippingAgentOrganization_DuplicateLegalName_ReturnsConflict(string code, string legalName, string alternativeName, string address, string taxNumber, string reName, string reCitizenId, string reNationality, string reEmail, string rePhone)
        {
            var newOrg = new ShippingAgentOrganizationWithRepresentativeDTO
            {
                Code = code,
                LegalName = legalName,
                AlternativeName = alternativeName,
                Address = address,
                TaxNumber = taxNumber,
                RepresentativeName = reName,
                RepresentativeCitizenId = reCitizenId,
                RepresentativeNationality = reNationality,
                RepresentativeEmail = reEmail,
                RepresentativePhoneNumber = rePhone
            };

            var postResponse = await _client.PostAsJsonAsync($"/api/ShippingAgentOrganization", newOrg);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("UNIQUECODE", "Unique Shipping Agent", "Unique SA", "Address1", "TAX123456", "Test1", "TEST1", "PT", "test@gmail.com", "123456789")]
        [InlineData("ANOTHERCODE", "Another Shipping Agent", "Another SA", "Address2", "TAX654321", "Test2", "TEST2", "PT", "test2@gmail.com", "123456782")]
        public async Task PostShippingAgentOrganization_DuplicateAddress_ReturnsConflict(string code, string legalName, string alternativeName, string address, string taxNumber, string repName, string repCitizenId, string repNationality, string repEmail, string repPhone)
        {
            var newOrg = new ShippingAgentOrganizationWithRepresentativeDTO
            {
                Code = code,
                LegalName = legalName,
                AlternativeName = alternativeName,
                Address = address,
                TaxNumber = taxNumber,
                RepresentativeName = repName,
                RepresentativeCitizenId = repCitizenId,
                RepresentativeNationality = repNationality,
                RepresentativeEmail = repEmail,
                RepresentativePhoneNumber = repPhone
            };

            var postResponse = await _client.PostAsJsonAsync($"/api/ShippingAgentOrganization", newOrg);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("UNIQUECODE", "Unique Shipping Agent", "Unique SA", "789 New Harbor St", "TaxNumber1", "Test1", "TEST1", "PT", "test@gmail.com", "123456789")]
        [InlineData("ANOTHERCODE", "Another Shipping Agent", "Another SA", "101 New Dock Rd", "TaxNumber2", "Test2", "TEST2", "PT", "test2@gmail.com", "123456729")]
        public async Task PostShippingAgentOrganization_DuplicateTaxNumber_ReturnsConflict(string code, string legalName, string alternativeName, string address, string taxNumber, string repName, string repCitizenId, string repNationality, string repEmail, string repPhone)
        {
            var newOrg = new ShippingAgentOrganizationWithRepresentativeDTO
            {
                Code = code,
                LegalName = legalName,
                AlternativeName = alternativeName,
                Address = address,
                TaxNumber = taxNumber,
                RepresentativeName = repName,
                RepresentativeCitizenId = repCitizenId,
                RepresentativeNationality = repNationality,
                RepresentativeEmail = repEmail,
                RepresentativePhoneNumber = repPhone
            };

            var postResponse = await _client.PostAsJsonAsync($"/api/ShippingAgentOrganization", newOrg);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("", "Valid Legal Name", "Valid Alt Name", "Valid Address", "VALIDTAX")] // Empty Code
        [InlineData("INVALID CODE!", "Valid Legal Name", "Valid Alt Name", "Valid Address", "VALIDTAX")] // Invalid Code with special characters
        [InlineData("VALIDCODE", "", "Valid Alt Name", "Valid Address", "VALIDTAX")] // Empty LegalName
        [InlineData("VALIDCODE", "Valid Legal Name", "", "Valid Address", "VALIDTAX")] // Empty AlternativeName
        [InlineData("VALIDCODE", "Valid Legal Name", "Valid Alt Name", "", "VALIDTAX")] // Empty Address
        [InlineData("VALIDCODE", "Valid Legal Name", "Valid Alt Name", "Valid Address", "")] // Empty TaxNumber
        public async Task PostShippingAgentOrganization_InvalidData_ReturnsBadRequest(string code, string legalName, string alternativeName, string address, string taxNumber)
        {
            var newOrg = new ShippingAgentOrganizationWithRepresentativeDTO
            {
                Code = code,
                LegalName = legalName,
                AlternativeName = alternativeName,
                Address = address,
                TaxNumber = taxNumber
            };

            var postResponse = await _client.PostAsJsonAsync($"/api/ShippingAgentOrganization", newOrg);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

    }
}