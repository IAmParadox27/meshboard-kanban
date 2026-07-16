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

        [JsonPropertyName("commentsCount")]
        public int CommentsCount { get; set; }

        [JsonPropertyName("user")]
        public FiderUserResponse? User { get; set; }

        [JsonPropertyName("response")]
        public FiderResponseContent? Response { get; set; }
    }

    public class FiderCommentResponse
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("content")]
        public string? Content { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTimeOffset CreatedAt { get; set; }

        [JsonPropertyName("editedAt")]
        public DateTimeOffset? EditedAt { get; set; }

        [JsonPropertyName("user")]
        public FiderUserResponse? User { get; set; }

        [JsonPropertyName("editedBy")]
        public FiderUserResponse? EditedBy { get; set; }
    }

    public class FiderUserResponse
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = null!;

        [JsonPropertyName("role")]
        public string? Role { get; set; }
    }

    public class FiderResponseContent
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }

        [JsonPropertyName("respondedAt")]
        public DateTimeOffset? RespondedAt { get; set; }

        [JsonPropertyName("user")]
        public FiderUserResponse? User { get; set; }

        [JsonPropertyName("original")]
        public string? Original { get; set; }
    }
}