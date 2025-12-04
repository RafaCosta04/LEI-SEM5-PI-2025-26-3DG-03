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

using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;

namespace WebApi.IntegrationTests.Tests;

public class IncidentTypeIntegrationTest : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public IncidentTypeIntegrationTest(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OEMContext>();
            WebApi.IntegrationTests.Helpers.Utilities.ReinitializeDbForTests(db);
        }
        _client = factory.CreateClient();
    }


    [Fact]
    public async Task GetAllIncidentTypes_ReturnsOkAndList()
    {
        var response = await _client.GetAsync("/api/IncidentType");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var incidentTypes = await response.Content.ReadFromJsonAsync<List<IncidentTypeDTO>>();
        Assert.NotNull(incidentTypes);
        Assert.True(incidentTypes.Count > 0);
    }

    [Theory]
    [InlineData("ENV-COND")]
    [InlineData("OPR-FAIL")]
    public async Task GetIncidentTypeByCode_ReturnsOkAndCorrectCode(string code)
    {
        var response = await _client.GetAsync($"/api/IncidentType/ByCode/{code}");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var incidentType = await response.Content.ReadFromJsonAsync<IncidentTypeDTO>();
        Assert.NotNull(incidentType);
        Assert.Equal(code, incidentType!.Code);
    }

    [Theory]
    [InlineData("INVALID-CODE-1")]
    [InlineData("INVALID-CODE-2")]
    public async Task GetIncidentTypeByCode_NotFound_ReturnsNotFound(string invalidCode)
    {
        var response = await _client.GetAsync($"/api/IncidentType/ByCode/{invalidCode}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetIncidentTypeById_ExistingId_ReturnsOkAndCorrectId()
    {
        var getByCodeResponse = await _client.GetAsync("/api/IncidentType/ByCode/ENV-COND");
        getByCodeResponse.EnsureSuccessStatusCode();
        var existingIncidentType = await getByCodeResponse.Content.ReadFromJsonAsync<IncidentTypeDTO>();
        Assert.NotNull(existingIncidentType);

        var response = await _client.GetAsync($"/api/IncidentType/ById/{existingIncidentType.Id}");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var incidentType = await response.Content.ReadFromJsonAsync<IncidentTypeDTO>();
        Assert.NotNull(incidentType);
        Assert.Equal(existingIncidentType.Id, incidentType!.Id);
        Assert.Equal("ENV-COND", incidentType.Code);
    }

    [Theory]
    [InlineData(999)]
    [InlineData(-1)]
    public async Task GetIncidentTypeById_NotFound_ReturnsNotFound(long id)
    {
        var response = await _client.GetAsync($"/api/IncidentType/ById/{id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("Minor")]
    [InlineData("Major")]
    public async Task GetIncidentTypesByClassification_ReturnsOkAndList(string classification)
    {
        var response = await _client.GetAsync($"/api/IncidentType/ByClassification/{classification}");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var incidentTypes = await response.Content.ReadFromJsonAsync<List<IncidentTypeDTO>>();
        Assert.NotNull(incidentTypes);
        Assert.All(incidentTypes, it => Assert.Equal(classification, it.Classification.ToString()));
    }

    [Theory]
    [InlineData("ENV-COND")]
    [InlineData("OPR-FAIL")]
    public async Task GetIncidentTypesByParent_ReturnsOkAndList(string parentCode)
    {
        var response = await _client.GetAsync($"/api/IncidentType/ByParent/{parentCode}");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var incidentTypes = await response.Content.ReadFromJsonAsync<List<IncidentTypeDTO>>();
        Assert.NotNull(incidentTypes);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task GetIncidentTypesWithParent_ReturnsOkAndList(bool hasParent)
    {
        var response = await _client.GetAsync($"/WithParent/{hasParent}");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var incidentTypes = await response.Content.ReadFromJsonAsync<List<IncidentTypeDTO>>();
        Assert.NotNull(incidentTypes);
    }

    [Fact]
    public async Task PostIncidentType_CreatesNewIncidentType_ReturnsCreated()
    {
        var newIncidentType = new
        {
            Code = "NEW-CODE-123",
            Name = "New Incident Type",
            Description = "Description for new incident type",
            Classification = "Minor"
        };
        var response = await _client.PostAsJsonAsync("/api/IncidentType", newIncidentType);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<IncidentTypeDTO>();
        Assert.NotNull(created);
        Assert.Equal(newIncidentType.Code, created!.Code);
        Assert.Equal(newIncidentType.Name, created.Name);
    }

    [Fact]
    public async Task PostIncidentType_WithExistingCode_ReturnsConflict()
    {
        var existingIncidentType = new
        {
            Code = "ENV-COND",
            Name = "Duplicate Code Incident",
            Description = "Trying duplicate code",
            Classification = "Minor"
        };
        var response = await _client.PostAsJsonAsync("/api/IncidentType", existingIncidentType);
        Assert.True(response.StatusCode == HttpStatusCode.Conflict || response.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostIncidentType_WithInvalidClassification_ReturnsBadRequest()
    {
        var invalidIncidentType = new
        {
            Code = "INVALID-CLASS",
            Name = "Invalid Classification",
            Description = "Invalid classification test",
            Classification = "INVALID"
        };
        var response = await _client.PostAsJsonAsync("/api/IncidentType", invalidIncidentType);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateIncidentType_UpdatesSuccessfully_ReturnsOk()
    {
        var updateDto = new
        {
            Code = "ENV-COND",
            Name = "Updated Name",
            Description = "Updated Description",
            Classification = "Minor"
        };
        var response = await _client.PutAsJsonAsync("/api/IncidentType/Update/ENV-COND", updateDto);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UpdateIncidentType_WithNonExistentCode_ReturnsNotFound()
    {
        var updateDto = new
        {
            Code = "NON-EXISTENT",
            Name = "Name",
            Description = "Description",
            Classification = "Minor"
        };
        var response = await _client.PutAsJsonAsync("/api/IncidentType/Update/NON-EXISTENT", updateDto);
        Assert.True(response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateIncidentType_WithExistingName_ReturnsConflictOrBadRequest()
    {
        var updateDto = new
        {
            Code = "ENV-COND",
            Name = "Operational Failures", 
            Description = "Trying duplicate name",
            Classification = "Minor"
        };
        var response = await _client.PutAsJsonAsync("/api/IncidentType/Update/ENV-COND", updateDto);
        Assert.True(response.StatusCode == HttpStatusCode.Conflict || response.StatusCode == HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("Minor")]
    [InlineData("Major")]
    [InlineData("Critical")]
    public async Task PostIncidentType_WithValidClassification_ReturnsCreated(string classification)
    {
        var newIncidentType = new
        {
            Code = $"TEST-{classification}",
            Name = $"Test {classification}",
            Description = $"Test incident type with {classification} classification",
            Classification = classification
        };
        var response = await _client.PostAsJsonAsync("/api/IncidentType", newIncidentType);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<IncidentTypeDTO>();
        Assert.NotNull(created);
        Assert.Equal(newIncidentType.Code, created!.Code);
        Assert.Equal(classification, created.Classification.ToString());
    }

    [Fact]
    public async Task PostIncidentType_WithParent_ReturnsCreated()
    {
        var newIncidentType = new
        {
            Code = "CHILD-TEST",
            Name = "Child Test Incident",
            Description = "Child incident type for testing",
            Classification = "Minor",
            ParentIncidentTypeCode = "ENV-COND"
        };
        var response = await _client.PostAsJsonAsync("/api/IncidentType", newIncidentType);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<IncidentTypeDTO>();
        Assert.NotNull(created);
        Assert.Equal("CHILD-TEST", created!.Code);
        Assert.Equal("ENV-COND", created.ParentIncidentTypeCode);
    }

    [Fact]
    public async Task PostIncidentType_WithNonExistentParent_ReturnsBadRequest()
    {
        var newIncidentType = new
        {
            Code = "ORPHAN-TEST",
            Name = "Orphan Test Incident",
            Description = "Incident type with invalid parent",
            Classification = "Minor",
            ParentIncidentTypeCode = "INVALID-PARENT"
        };
        var response = await _client.PostAsJsonAsync("/api/IncidentType", newIncidentType);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostIncidentType_WithExistingName_ReturnsConflictOrBadRequest()
    {
        var duplicateNameIncidentType = new
        {
            Code = "NEW-UNIQUE-CODE",
            Name = "Environmental Conditions", 
            Description = "Trying duplicate name",
            Classification = "Minor"
        };
        var response = await _client.PostAsJsonAsync("/api/IncidentType", duplicateNameIncidentType);
        Assert.True(response.StatusCode == HttpStatusCode.Conflict || response.StatusCode == HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("Minor")]
    [InlineData("Major")]
    [InlineData("Critical")]
    public async Task UpdateIncidentType_WithDifferentClassifications_ReturnsOk(string classification)
    {
        var updateDto = new
        {
            Code = "OPR-FAIL",
            Name = "Updated Operational Failures",
            Description = "Updated description",
            Classification = classification
        };
        var response = await _client.PutAsJsonAsync("/api/IncidentType/Update/OPR-FAIL", updateDto);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var getResponse = await _client.GetAsync("/api/IncidentType/ByCode/OPR-FAIL");
        var updated = await getResponse.Content.ReadFromJsonAsync<IncidentTypeDTO>();
        Assert.NotNull(updated);
        Assert.Equal(classification, updated!.Classification.ToString());
    }

    [Fact]
    public async Task UpdateIncidentType_WithParent_ReturnsOk()
    {
        var updateDto = new
        {
            Code = "FOG",
            Name = "Updated Fog",
            Description = "Updated fog description",
            Classification = "Minor",
            ParentIncidentTypeCode = "OPR-FAIL" 
        };
        var response = await _client.PutAsJsonAsync("/api/IncidentType/Update/FOG", updateDto);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var getResponse = await _client.GetAsync("/api/IncidentType/ByCode/FOG");
        var updated = await getResponse.Content.ReadFromJsonAsync<IncidentTypeDTO>();
        Assert.NotNull(updated);
        Assert.Equal("OPR-FAIL", updated!.ParentIncidentTypeCode);
    }

    [Fact]
    public async Task GetIncidentTypesByParent_ValidParent_ReturnsChildren()
    {
        var response = await _client.GetAsync("/api/IncidentType/ByParent/ENV-COND");
        response.EnsureSuccessStatusCode();
        var children = await response.Content.ReadFromJsonAsync<List<IncidentTypeDTO>>();
        Assert.NotNull(children);
        Assert.Contains(children, it => it.Code == "FOG");
    }

    [Fact]
    public async Task GetIncidentTypesWithParent_True_ReturnsOnlyChildren()
    {
        var response = await _client.GetAsync("/WithParent/true");
        response.EnsureSuccessStatusCode();
        var incidentTypes = await response.Content.ReadFromJsonAsync<List<IncidentTypeDTO>>();
        Assert.NotNull(incidentTypes);
        Assert.All(incidentTypes, it => Assert.NotNull(it.ParentIncidentTypeCode));
    }

    [Fact]
    public async Task GetIncidentTypesWithParent_False_ReturnsOnlyParents()
    {
        var response = await _client.GetAsync("/WithParent/false");
        response.EnsureSuccessStatusCode();
        var incidentTypes = await response.Content.ReadFromJsonAsync<List<IncidentTypeDTO>>();
        Assert.NotNull(incidentTypes);
        Assert.All(incidentTypes, it => Assert.Null(it.ParentIncidentTypeCode));
    }

    [Fact]
    public async Task PostIncidentType_WithEmptyCode_ReturnsBadRequest()
    {
        var invalidIncidentType = new
        {
            Code = "",
            Name = "Invalid Code Test",
            Description = "Test with empty code",
            Classification = "Minor"
        };
        var response = await _client.PostAsJsonAsync("/api/IncidentType", invalidIncidentType);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostIncidentType_WithEmptyName_ReturnsBadRequest()
    {
        var invalidIncidentType = new
        {
            Code = "EMPTY-NAME",
            Name = "",
            Description = "Test with empty name",
            Classification = "Minor"
        };
        var response = await _client.PostAsJsonAsync("/api/IncidentType", invalidIncidentType);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostIncidentType_WithEmptyDescription_ReturnsBadRequest()
    {
        var invalidIncidentType = new
        {
            Code = "EMPTY-DESC",
            Name = "Empty Description Test",
            Description = "",
            Classification = "Minor"
        };
        var response = await _client.PostAsJsonAsync("/api/IncidentType", invalidIncidentType);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostIncidentType_WithNullData_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/IncidentType", (IncidentTypeDTO?)null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateIncidentType_WithNullData_ReturnsBadRequest()
    {
        var response = await _client.PutAsJsonAsync("/api/IncidentType/Update/ENV-COND", (IncidentTypeDTO?)null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}