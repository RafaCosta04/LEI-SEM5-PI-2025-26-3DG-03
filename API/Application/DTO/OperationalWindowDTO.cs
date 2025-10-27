namespace Application.DTO
{
    using System;
    using System.Globalization;
    using System.Text.RegularExpressions;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Domain.Model;

    public class OperationalWindowDTO
    {
        [JsonConverter(typeof(DayOfWeekNumberConverter))]
        public DayOfWeek? StartDay { get; set; }

        [JsonConverter(typeof(DayOfWeekNumberConverter))]
        public DayOfWeek? EndDay { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }

        private static readonly Regex TimeFormatRegex = new Regex(@"^(?:[01]\d|2[0-3]):[0-5]\d$", RegexOptions.Compiled);

        public OperationalWindowDTO() { }

        public OperationalWindowDTO(DayOfWeek? startDay, DayOfWeek? endDay, string? startTime, string? endTime)
        {
            StartDay = startDay;
            EndDay = endDay;
            StartTime = startTime;
            EndTime = endTime;
        }

        public static OperationalWindowDTO ToDTO(OperationalWindow operationalWindow)
        {
            try
            {
                return new OperationalWindowDTO(
                    operationalWindow.StartDay,
                    operationalWindow.EndDay,
                    operationalWindow.StartTime.ToString(@"hh\:mm"),
                    operationalWindow.EndTime.ToString(@"hh\:mm")
                );
            }
            catch (ArgumentOutOfRangeException ex)
            {
                throw new ArgumentException($"Error converting to OperationalWindowDTO: {ex.Message}");
            }
        }

        public static OperationalWindow ToDomain(OperationalWindowDTO dto)
        {
            if (dto.StartDay == null)
                throw new InvalidOperationException("StartDay cannot be null.");

            if (dto.EndDay == null)
                throw new InvalidOperationException("EndDay cannot be null.");

            if (string.IsNullOrWhiteSpace(dto.StartTime))
                throw new InvalidOperationException("StartTime cannot be null or empty.");

            if (string.IsNullOrWhiteSpace(dto.EndTime))
                throw new InvalidOperationException("EndTime cannot be null or empty.");

            if (!IsValidTimeFormat(dto.StartTime))
                throw new FormatException("StartTime must be in format hh:mm (e.g., 08:30).");

            if (!IsValidTimeFormat(dto.EndTime))
                throw new FormatException("EndTime must be in format hh:mm (e.g., 17:45).");

            if (!TimeSpan.TryParseExact(dto.StartTime, @"hh\:mm", CultureInfo.InvariantCulture, out var startTime))
                throw new FormatException("StartTime must be in format hh:mm (e.g., 08:30).");

            if (!TimeSpan.TryParseExact(dto.EndTime, @"hh\:mm", CultureInfo.InvariantCulture, out var endTime))
                throw new FormatException("EndTime must be in format hh:mm (e.g., 17:45).");

            return new OperationalWindow(dto.StartDay.Value, dto.EndDay.Value, startTime, endTime);
        }


        private static bool IsValidTimeFormat(string time)
        {
            return TimeFormatRegex.IsMatch(time);
        }
    }

    // Converter that serializes DayOfWeek? as numbers and accepts numbers or strings on read
    internal class DayOfWeekNumberConverter : JsonConverter<DayOfWeek?>
    {
        public override DayOfWeek? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;
            if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt32(out var i))
            {
                if (Enum.IsDefined(typeof(DayOfWeek), i)) return (DayOfWeek)i;
                throw new JsonException("invalid day of the week");
            }
            if (reader.TokenType == JsonTokenType.String)
            {
                var s = reader.GetString();
                if (string.IsNullOrWhiteSpace(s)) return null;
                if (int.TryParse(s, out var i2) && Enum.IsDefined(typeof(DayOfWeek), i2)) return (DayOfWeek)i2;
                if (Enum.TryParse<DayOfWeek>(s, true, out var parsed)) return parsed;
                throw new JsonException("invalid day of the week");
            }
            throw new JsonException("invalid day of the week");
        }

        public override void Write(Utf8JsonWriter writer, DayOfWeek? value, JsonSerializerOptions options)
        {
            if (!value.HasValue) { writer.WriteNullValue(); return; }
            writer.WriteNumberValue((int)value.Value);
        }
    }
}
