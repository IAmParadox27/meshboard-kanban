using System.Text.Json.Serialization;

namespace Meshboard.Plugin.Fider
{
    public class FiderPostResponse
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("number")]
        public int Number { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = null!;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTimeOffset CreatedAt { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = null!;

        [JsonPropertyName("tags")]
        public List<string> Tags { get; set; } = [];

        [JsonPropertyName("user")]
        public FiderUserResponse? User { get; set; }

        [JsonPropertyName("response")]
        public FiderResponseContent? Response { get; set; }
    }

    public class FiderUserResponse
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = null!;
    }

    public class FiderResponseContent
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }

        [JsonPropertyName("respondedAt")]
        public DateTimeOffset? RespondedAt { get; set; }
    }
}