namespace Application.DTO;

using Domain.Model;
using System.Text.Json.Serialization;


public class SystemUserDTO
{
    public long Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public SystemRole Role { get; set; }

    public SystemUserStatus Status { get; set; }
    public bool IsFirstTime { get; set; }

    public SystemUserDTO() { }

    public SystemUserDTO(long id, string code, string username, string email, SystemRole role, bool isFirstTime, SystemUserStatus status)
    {
        Id = id;
        Code = code;
        Username = username;
        Email = email;
        Role = role;
        IsFirstTime = isFirstTime;
        Status = status;
    }

    static public SystemUserDTO ToDTO(SystemUser systemUser)
    {
        return new SystemUserDTO(systemUser.Id, systemUser.Code!, systemUser.Username!, systemUser.Email!, systemUser.Role, systemUser.IsFirstTime, systemUser.Status);
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