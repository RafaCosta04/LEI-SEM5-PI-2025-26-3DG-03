using System;
using System.Text.RegularExpressions;

namespace ShippingManagement.Domain.Qualifications
{
    public class Qualification
    {
        public long Id { get; set; }
        public string Code { get; private set; }
        public string Name { get; private set; }
        public string Description { get; private set; }

        private Qualification() { Code = string.Empty; Name = string.Empty; Description = string.Empty; }

        public Qualification(string code, string name, string description)
        {
            ValidateCode(code);
            ValidateName(name);
            ValidateDescription(description);

            Code = code.Trim();
            Name = name.Trim();
            Description = description.Trim();
        }

        public void ChangeName(string name)
        {
            ValidateName(name);
            Name = name.Trim();
        }

        public void ChangeDescription(string description)
        {
            ValidateDescription(description);
            Description = description.Trim();
        }

        private static void ValidateCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                throw new ArgumentException("Qualification code cannot be null or empty.", nameof(code));

            var trimmed = code.Trim();
            if (trimmed.Length > 15)
                throw new ArgumentException("Qualification code must be at most 15 characters long.", nameof(code));

            if (!Regex.IsMatch(trimmed, "^[A-Za-z0-9]+$"))
                throw new ArgumentException("Qualification code must be alphanumeric (letters and digits only).", nameof(code));
        }

        private static void ValidateName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Qualification name cannot be null or empty.", nameof(name));

            if (!Regex.IsMatch(name.Trim(), @"^[A-Za-z\s]+$"))
                throw new ArgumentException("Qualification name must contain only letters and spaces.", nameof(name));
        }

        private static void ValidateDescription(string description)
        {
            if (string.IsNullOrWhiteSpace(description))
                throw new ArgumentException("Qualification description cannot be null, empty, or whitespace.", nameof(description));

            var trimmed = description.Trim();
            if (trimmed.Length > 150)
                throw new ArgumentException("Qualification description must be at most 150 characters long.", nameof(description));

            var wordCount = trimmed.Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries).Length;
            if (wordCount < 2)
                throw new ArgumentException("Qualification description must contain at least two words.", nameof(description));
        }
    }
}
