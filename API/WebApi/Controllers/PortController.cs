using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Application.Services;
using Application.DTO;
using Domain.IRepository;
using Domain.Model.Resources;
using Domain.Model;
using System.Linq;

namespace WebApi.Controllers
{

    [ApiController]
    [Route("api/PortLayout")]
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
            var filePath = Path.Combine(_env.ContentRootPath, "Port", "layout.json");
            if (!System.IO.File.Exists(filePath))
                return NotFound("layout.json not found");

            var json = System.IO.File.ReadAllText(filePath);
            return Content(json, "application/json");
        }
    }

}
