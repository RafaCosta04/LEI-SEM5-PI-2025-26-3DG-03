namespace Application.DTO;

using Domain.Model;
using System.Text.Json.Serialization;


public class SystemUserDTO
{
    public long Id { get; set; }

    public string Code {get; set;} = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public SystemRole Role { get; set; }

    public bool IsActive { get; set; }

    public SystemUserDTO() { }

    public SystemUserDTO(long id,string code, string username, string email, SystemRole role,  bool isActive)
    {
        Id = id;
        Code = code;
        Username = username;
        Email = email;
        Role = role;
        IsActive = isActive;
    }

    static public SystemUserDTO ToDTO(SystemUser systemUser)
    {
        return new SystemUserDTO(systemUser.Id, systemUser.Code!,  systemUser.Username!, systemUser.Email!, systemUser.Role, systemUser.IsActive);
    }

    static public IEnumerable<SystemUserDTO> ToDTO(IEnumerable<SystemUser> systemUsers)
    {
        List<SystemUserDTO> systemUserDTOs = new List<SystemUserDTO>();
        foreach (SystemUser systemUser in systemUsers)
        {
            SystemUserDTO systemUserDTO = ToDTO(systemUser);
            systemUserDTOs.Add(systemUserDTO);
        }
        return systemUserDTOs;
    }
}