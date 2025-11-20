using System;
using System.Collections.Generic;
using Xunit;
using Domain.Model;
using System.Runtime.InteropServices;

namespace Domain.Tests
{
    
    public class SystemUserTest
    {
        [Fact]
        public void Create_ValidSystemUser_SetsPropertiesAndTrims()
        {
            var code = "USR0001";
            var username = "  testeUser  ";
            var email = "  user@example.com  ";

            var user = new SystemUser(code, username, email, SystemRole.Admin);

            Assert.Equal(code, user.Code);
            Assert.Equal("testeUser", user.Username);
            Assert.Equal("user@example.com", user.Email);
            Assert.Equal(SystemRole.Admin, user.Role);
            Assert.False(user.IsActive);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("ab")]
        [InlineData("abcdefghijklmnopqrstu")] //mais de 20 chars
        public void Constructor_InvalidUsername_ThrowsArgumentException(string badUsername)
        {
            var code = "USR0002";
            var email = "a@b.com";
            var ex = Assert.Throws<ArgumentException>(() => new SystemUser(code, badUsername!, email, SystemRole.Admin));
            Assert.Equal("username", ex.ParamName);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData("ABC123")] 
        [InlineData("USR12")]
        [InlineData("usr0001")] 
        public void Constructor_InvalidCode_Throws(string badCode)
        {
            var username = "validUser";
            var email = "u@u.com";

            var ex = Assert.Throws<ArgumentException>(() => new SystemUser(badCode!, username, email, SystemRole.Admin));
            Assert.Equal("code", ex.ParamName);
        }

        [Theory]
        [InlineData("not-an-email")]
        [InlineData("user@")]
        [InlineData("@example.com")]
        public void Constructor_InvalidEmail_Throws(string badEmail)
        {
            var code = "USR0010";
            var username = "validUser";

            var ex = Assert.Throws<ArgumentException>(() => new SystemUser(code, username, badEmail, SystemRole.Admin));
            Assert.Equal("email", ex.ParamName);
        }

        [Fact]
        public void ChangeBooleanStatus_TogglesIsActive()
        {
            var user = new SystemUser("USR0011", "tester", "t@t.com", SystemRole.Admin);
            Assert.False(user.IsActive);

            user.ChangeBooleanStatus(true);
            Assert.True(user.IsActive);

            user.ChangeBooleanStatus(false);
            Assert.False(user.IsActive);
        }

        [Fact]
        public void ChangeSystemRole_UpdatesRole()
        {
            var user = new SystemUser("USR0012", "tester", "t@t.com", SystemRole.Admin);
            Assert.Equal(SystemRole.Admin, user.Role);

            user.ChangeSystemRole(SystemRole.LogisticOperator);
            Assert.Equal(SystemRole.LogisticOperator, user.Role);
        }

        [Theory]
        [InlineData("abc")] // min length 3
        [InlineData("abcdefghijklmnopqrst")] // length 20
        public void Constructor_UsernameBoundaryAllowed(string okUsername)
        {
            var user = new SystemUser("USR0020", okUsername, "ok@ok.com", SystemRole.Admin);
            Assert.Equal(okUsername, user.Username);
        }
    }
}