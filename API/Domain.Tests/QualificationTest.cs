using System;
using Xunit;
using ShippingManagement.Domain.Qualifications;
using System.Runtime.InteropServices;

namespace Domain.Tests
{
    public class QualificationTest
    {
        [Theory]
        [InlineData("Q1", "Ship Captain", "Professional maritime leader")]
        [InlineData("Q2", "Engine Officer", "Responsible for engine operations")]
        [InlineData("Q3", "Safety Inspector", "Ensures compliance with regulations")]
        public void Constructor_ValidParameters_ShouldCreateObject(string code, string name, string desc = "")
        {
            var qualification = new Qualification(code, name, desc);
            Assert.Equal(code, qualification.Code);
            Assert.Equal(name, qualification.Name);
            Assert.Equal(desc, qualification.Description);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("first second")]
        [InlineData("123456789012345678")]
        [InlineData("Q1-special")]
        public void Constructor_InvalidCode_ShouldThrow(string code)
        {
            Assert.Throws<ArgumentException>(() => new Qualification(code, "Valid Name", "Valid description here"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("123")]
        [InlineData("Name-Special")]
        public void Constructor_InvalidName_ShouldThrow(string name)
        {
            Assert.Throws<ArgumentException>(() => new Qualification("ValidCode", name, "Valid description here"));
        }

        [Fact]
        public void ChangeName_ValidName_ShouldUpdateName()
        {
            var qualification = new Qualification("Q1", "Old Name", "Valid description here");
            qualification.ChangeName("New Name");
            Assert.Equal("New Name", qualification.Name);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("123")]
        [InlineData("Name-Special")]
        public void ChangeName_InvalidName_ShouldThrow(string name)
        {
            var qualification = new Qualification("Q1", "Old Name", "Valid description here");
            Assert.Throws<ArgumentException>(() => qualification.ChangeName(name));
        }

        [Fact]
        public void ChangeDescription_ValidDescription_ShouldUpdateDescription()
        {
            var qualification = new Qualification("Q1", "Ship Captain", "Old description here");
            qualification.ChangeDescription("New description updated successfully");
            Assert.Equal("New description updated successfully", qualification.Description);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("OneWord")]
        [InlineData("This is way too long description that definitely exceeds one hundred fifty characters limit and should throw an exception when trying to set it as description")] // Too long
        public void ChangeDescription_InvalidDescription_ShouldThrow(string description)
        {
            var qualification = new Qualification("Q1", "Ship Captain", "Valid description here");
            Assert.Throws<ArgumentException>(() => qualification.ChangeDescription(description));
        }

        [Theory]
        [InlineData("Short")]
        [InlineData("A")]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        [InlineData("This is a very long description that exceeds the maximum allowed length of one hundred and fifty characters which should definitely fail validation because it is way too long")] // Too long (over 150 chars)
        public void Constructor_InvalidDescription_ShouldThrow(string description)
        {
            Assert.Throws<ArgumentException>(() => new Qualification("Q1", "Valid Name", description));
        }

        [Fact]
        public void Constructor_ValidTwoWordDescription_ShouldWork()
        {
            var qualification = new Qualification("Q1", "Ship Captain", "Professional leader");
            Assert.Equal("Professional leader", qualification.Description);
        }
    }
}