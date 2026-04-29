using System.Text.Json;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Seed;

public class SeedFromJsonService(CalendarDayDbContext db)
{
    public async Task SeedAsync(string jsonPath, CancellationToken ct = default)
    {
        if (!File.Exists(jsonPath))
            throw new FileNotFoundException("Seed JSON not found", jsonPath);

        if (await db.Elections.AnyAsync(ct))
            return;

        var json = await File.ReadAllTextAsync(jsonPath, ct);
        var data = JsonSerializer.Deserialize<List<ElectionSeed>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? [];

        foreach (var electionSeed in data)
        {
            var election = new Election
            {
                Id = Guid.NewGuid(),
                Title = electionSeed.Title,
                IsActive = electionSeed.IsActive,
                Eday = ParseDateOnly(electionSeed.Eday),
            };

            foreach (var deadlineSeed in electionSeed.Deadlines)
            {
                var deadline = new Deadline
                {
                    Id = Guid.NewGuid(),
                    ElectionId = election.Id,
                    Title = deadlineSeed.Title,
                    AdditionalInfo = deadlineSeed.AdditionalInfo,
                    Type = Deadline.TypeSingle,
                    DeadlineDate = ParseDateOnly(deadlineSeed.Deadline),
                    StartDate = ParseDateOnly(deadlineSeed.Deadline),
                    EndDate = ParseDateOnly(deadlineSeed.Deadline),
                    Description = deadlineSeed.Description ?? string.Empty,
                };
                deadline.Dates = new List<DeadlineDate>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        DeadlineId = deadline.Id,
                        EventDate = deadline.DeadlineDate
                    }
                };

                deadline.Responsibles = deadlineSeed.Responsible
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => new DeadlineResponsible { Id = Guid.NewGuid(), Value = x.Trim() })
                    .ToList();

                deadline.Groups = deadlineSeed.Group
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => new DeadlineGroup { Id = Guid.NewGuid(), Value = x.Trim() })
                    .ToList();

                deadline.Regulations = deadlineSeed.Regulations
                    .Select(r => new Regulation
                    {
                        Id = Guid.NewGuid(),
                        Title = r.Title,
                        Link = r.Link ?? string.Empty,
                    })
                    .ToList();

                election.Deadlines.Add(deadline);
            }

            db.Elections.Add(election);
        }

        await db.SaveChangesAsync(ct);
    }

    private static DateOnly ParseDateOnly(string value)
    {
        var trimmed = value.Trim();
        if (DateOnly.TryParse(trimmed, out var date)) return date;

        var maybeRange = trimmed.Split('-', StringSplitOptions.TrimEntries);
        if (maybeRange.Length >= 1 && DateOnly.TryParse(maybeRange[0], out var rangeStart)) return rangeStart;

        return DateOnly.FromDateTime(DateTime.UtcNow);
    }

    private sealed class ElectionSeed
    {
        public string Title { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string Eday { get; set; } = string.Empty;
        public List<DeadlineSeed> Deadlines { get; set; } = [];
    }

    private sealed class DeadlineSeed
    {
        public string Title { get; set; } = string.Empty;
        public string? AdditionalInfo { get; set; }
        public string Deadline { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> Responsible { get; set; } = [];
        public List<string> Group { get; set; } = [];
        public List<RegulationSeed> Regulations { get; set; } = [];
    }

    private sealed class RegulationSeed
    {
        public string Title { get; set; } = string.Empty;
        public string? Link { get; set; }
    }
}
