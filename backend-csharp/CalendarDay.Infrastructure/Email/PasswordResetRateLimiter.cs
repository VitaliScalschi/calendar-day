using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace CalendarDay.Infrastructure.Email;

public class PasswordResetRateLimiter(IMemoryCache cache, IOptions<PasswordResetOptions> options)
{
    public bool TryAcquire(string email, string? clientIp)
    {
        var cfg = options.Value;
        var now = DateTimeOffset.UtcNow;
        var emailKey = $"pwd-reset:email:{email.Trim().ToLowerInvariant()}";
        var ipKey = string.IsNullOrWhiteSpace(clientIp)
            ? null
            : $"pwd-reset:ip:{clientIp.Trim()}";

        if (!TryIncrement(emailKey, cfg.MaxRequestsPerEmailPerHour, now))
        {
            return false;
        }

        if (ipKey is not null && !TryIncrement(ipKey, cfg.MaxRequestsPerIpPerHour, now))
        {
            return false;
        }

        return true;
    }

    private bool TryIncrement(string key, int maxPerHour, DateTimeOffset now)
    {
        var windowStart = now.AddHours(-1);
        var entry = cache.GetOrCreate(key, e =>
        {
            e.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return new RateLimitEntry();
        })!;

        lock (entry)
        {
            entry.Timestamps.RemoveAll(t => t < windowStart);
            if (entry.Timestamps.Count >= maxPerHour)
            {
                return false;
            }

            entry.Timestamps.Add(now);
            cache.Set(key, entry, TimeSpan.FromHours(1));
            return true;
        }
    }

    private sealed class RateLimitEntry
    {
        public List<DateTimeOffset> Timestamps { get; } = [];
    }
}
