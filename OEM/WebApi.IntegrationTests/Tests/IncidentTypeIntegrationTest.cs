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
    public async Task GetAllIncidentTypes_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/IncidentType");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("ENV-COND")]
    [InlineData("OPR-FAIL")]
    public async Task GetIncidentTypeByCode_ReturnsOk(string code)
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
    public async Task GetIncidentTypeByCode_NotFound(string invalidCode)
    {
        var response = await _client.GetAsync($"/api/IncidentType/ByCode/{invalidCode}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}