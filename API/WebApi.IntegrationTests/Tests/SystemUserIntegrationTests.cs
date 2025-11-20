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
using System.Collections.Generic;

namespace WebApi.IntegrationTests.Tests
{

    public class SystemUserIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public SystemUserIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }

        [Fact]
        public async Task GetAllSystemUsers_ReturnsOkAndContainsSeeded()
        {
            var response = await _client.GetAsync("/api/SystemUser");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var users = await response.Content.ReadFromJsonAsync<List<SystemUserDTO>>();
            Assert.NotNull(users);
            Assert.Contains(users, u => u.Code == "USR1111");
            Assert.Contains(users, u => u.Code == "USR2222");
        }

        [Fact]
        public async Task GetSystemUserByCode_FoundAndNotFound()
        {
            var found = await _client.GetAsync("/api/SystemUser/ByCode/USR1111");
            Assert.Equal(HttpStatusCode.OK, found.StatusCode);
            var dto = await found.Content.ReadFromJsonAsync<SystemUserDTO>();
            Assert.NotNull(dto);
            Assert.Equal("USR1111", dto.Code);

            var notFound = await _client.GetAsync("/api/SystemUser/ByCode/UNKNOWN");
            Assert.Equal(HttpStatusCode.NotFound, notFound.StatusCode);
        }

        [Fact]
        public async Task GetSystemUserByUsername_FoundAndNotFound()
        {
            var found = await _client.GetAsync("/api/SystemUser/ByUsername/adminTeste");
            Assert.Equal(HttpStatusCode.OK, found.StatusCode);
            var dto = await found.Content.ReadFromJsonAsync<SystemUserDTO>();
            Assert.NotNull(dto);
            Assert.Equal("adminTeste", dto.Username);

            var notFound = await _client.GetAsync("/api/SystemUser/ByUsername/noonehere");
            Assert.Equal(HttpStatusCode.NotFound, notFound.StatusCode);
        }

        [Fact]
        public async Task GetSystemUserByEmail_FoundAndNotFound()
        {
            var found = await _client.GetAsync("/api/SystemUser/ByEmail/admin.teste@example.com");
            Assert.Equal(HttpStatusCode.OK, found.StatusCode);
            var dto = await found.Content.ReadFromJsonAsync<SystemUserDTO>();
            Assert.NotNull(dto);
            Assert.Equal("admin.teste@example.com", dto.Email);

            var notFound = await _client.GetAsync("/api/SystemUser/ByEmail/noone@example.com");
            Assert.Equal(HttpStatusCode.NotFound, notFound.StatusCode);
        }

        [Fact]
        public async Task GetSystemUsersByRole_ReturnsExpected()
        {
            var resp = await _client.GetAsync($"/api/SystemUser/ByRole/{SystemRole.Admin}");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var list = await resp.Content.ReadFromJsonAsync<List<SystemUserDTO>>();
            Assert.NotNull(list);
            Assert.Contains(list, u => u.Role == SystemRole.Admin);
        }

        [Fact]
        public async Task GetSystemUserById_FoundAndNotFound()
        {
            var all = await _client.GetAsync("/api/SystemUser");
            all.EnsureSuccessStatusCode();
            var users = await all.Content.ReadFromJsonAsync<List<SystemUserDTO>>();
            Assert.NotNull(users);
            Assert.NotEmpty(users);

            var id = users![0].Id;
            var resp = await _client.GetAsync($"/api/SystemUser/ByID/{id}");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

            var notFound = await _client.GetAsync($"/api/SystemUser/ByID/{int.MaxValue}");
            Assert.Equal(HttpStatusCode.NotFound, notFound.StatusCode);
        }

        [Theory]
        [InlineData("USR4444","newuser","new.user@example.com","LogisticOperator", false, 201)]
        [InlineData("USR5555","adminTeste","unique.email@example.com","LogisticOperator", true, 409)]
        [InlineData("USR6666","uniqueusername","admin.teste@example.com","LogisticOperator", true, 409)]
        [InlineData("BADCODE","someuser","some.user@example.com","LogisticOperator", true, 400)]
        public async Task PostSystemUser_VariousInputs_ReturnsExpected(string code, string username, string email, string roleString, bool isActive, int expectedStatus)
        {
            var dto = new SystemUserDTO
            {
                Code = code,
                Username = username,
                Email = email,
                Role = Enum.Parse<SystemRole>(roleString),
                IsActive = isActive
            };

            var resp = await _client.PostAsJsonAsync("/api/SystemUser", dto);
            Assert.Equal((HttpStatusCode)expectedStatus, resp.StatusCode);

            if (resp.StatusCode == HttpStatusCode.Created)
            {
                var get = await _client.GetAsync($"/api/SystemUser/ByCode/{dto.Code}");
                Assert.Equal(HttpStatusCode.OK, get.StatusCode);
                var returned = await get.Content.ReadFromJsonAsync<SystemUserDTO>();
                Assert.NotNull(returned);
                Assert.Equal(dto.Username, returned.Username);
                Assert.Equal(dto.Email, returned.Email);
                Assert.Equal(dto.Role, returned.Role);
            }
        }

        [Theory]
        [InlineData("USR2222","Admin",200)]
        [InlineData("USR1111","LogisticOperator",200)]
        public async Task PutSystemUser_UpdateStatusAndRole_Various(string code, string newRoleString, int expectedStatus)
        {
            var get = await _client.GetAsync($"/api/SystemUser/ByCode/{code}");
            Assert.Equal(HttpStatusCode.OK, get.StatusCode);
            var dto = await get.Content.ReadFromJsonAsync<SystemUserDTO>();
            Assert.NotNull(dto);

            dto.IsActive = !dto.IsActive;
            dto.Role = Enum.Parse<SystemRole>(newRoleString);

            var put = await _client.PutAsJsonAsync($"/api/SystemUser/Update/{dto.Code}", dto);
            Assert.Equal((HttpStatusCode)expectedStatus, put.StatusCode);

            if (put.StatusCode == HttpStatusCode.OK)
            {
                var check = await _client.GetAsync($"/api/SystemUser/ByCode/{dto.Code}");
                var updated = await check.Content.ReadFromJsonAsync<SystemUserDTO>();
                Assert.NotNull(updated);
                Assert.Equal(dto.IsActive, updated.IsActive);
                Assert.Equal(dto.Role, updated.Role);
            }
        }

        [Fact]
        public async Task PutSystemUser_CodeMismatch_ReturnsBadRequest()
        {
            var get = await _client.GetAsync("/api/SystemUser/ByCode/USR1111");
            var dto = await get.Content.ReadFromJsonAsync<SystemUserDTO>();
            Assert.NotNull(dto);

            dto.Code = "USR9999"; 
            var put = await _client.PutAsJsonAsync($"/api/SystemUser/Update/USR1111", dto);
            Assert.Equal(HttpStatusCode.BadRequest, put.StatusCode);
        }

        [Theory]
        [InlineData("USR1111","operatorTeste",400)]
        public async Task PutSystemUser_DuplicateUsername_ReturnsBadRequest(string code, string newUsername, int expectedStatus)
        {
            var get = await _client.GetAsync($"/api/SystemUser/ByCode/{code}");
            var dto = await get.Content.ReadFromJsonAsync<SystemUserDTO>();
            Assert.NotNull(dto);

            dto.Username = newUsername;
            var put = await _client.PutAsJsonAsync($"/api/SystemUser/Update/{dto.Code}", dto);
            Assert.Equal((HttpStatusCode)expectedStatus, put.StatusCode);
        }

    }

}