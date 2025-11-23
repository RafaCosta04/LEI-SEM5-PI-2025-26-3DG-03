using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using System;
using System.IO;
using Application.Services;
using Application.DTO;
using Domain.IRepository;
using Domain.Model.Resources;
using Domain.Model;
using System.Linq;
using Microsoft.AspNetCore.Authorization;


namespace WebApi.Controllers
{

    [ApiController]
    [Route("api/PortLayout")]
    [Authorize]
    public class PortController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public PortController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpGet("Layout")]
        public IActionResult GetLayout()
        {
            var projectRoot = Path.GetFullPath(Path.Combine(_env.ContentRootPath, ".."));
            var filePath = Path.Combine(projectRoot, "Port", "layout.json");

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound($"layout.json not found at {filePath}");
            }

            var json = System.IO.File.ReadAllText(filePath);
            return Content(json, "application/json");
        }
    }

}
