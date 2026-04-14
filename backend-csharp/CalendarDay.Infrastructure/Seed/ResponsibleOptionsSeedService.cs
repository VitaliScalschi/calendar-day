using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Seed;

public class ResponsibleOptionsSeedService(CalendarDayDbContext db)
{
    private static readonly string[] DefaultLabels =
    [
        "CEC (DMA)",
        "CEC (DJ)",
        "APC",
        "Întreprinderile și instituțiile de stat",
        "Partidele politice reprezentate în Parlament",
        "Consiliile locale de nivelul I",
        "Președinții CECE de nivelul II",
        "CECE de nivelul I",
        "CEC(DCRPMM)",
        "BESV",
        "CEC(DFE)",
        "CICDE",
        "ASP",
        "MAI",
        "CEC(SRU)",
        "Blocurile electorale",
        "Partidele politice",
        "Candidații independenți",
        "CEC(DTIGLE)",
        "Concurenții electorali",
        "Comisia de recepționare a documentelor pentru înregistrarea participanților la referendum",
        "Participanții la referendum",
        "Difuzorii de publicitate deținătorii sau gestionarii dispozitivelor de publicitate fixă sau mobilă",
        "Persoanele de încredere ale concurenților electorali",
        "Cetățenii RM",
        "APL",
        "Difuzorii de publicitate",
        "Agențiile de publicitate",
        "Persoanele de încredere ale concurenților electorali/participanților la referendum",
        "CEC(DSCFPPCE)",
        "Grupurile de inițiativă",
        "Serviciul Fiscal de Stat",
        "Furnizorii de servicii media",
        "Difuzorii de publicitate proprietari sau gestionari ai dispozitivelor de publicitate fixă sau mobilă",
        "Instituțiile bancare",
        "Ministerul Finanțelor",
        "Aparatul CEC",
        "Organizațiile de cercetare/sondare sociologică",
        "Instituția tipografică",
        "SIS",
    ];

    public async Task EnsureDefaultResponsibleOptionsAsync(CancellationToken ct = default)
    {
        var existingLabels = await db.ResponsibleOptions
            .Select(x => x.Label)
            .ToListAsync(ct);

        var existing = new HashSet<string>(existingLabels, StringComparer.OrdinalIgnoreCase);
        var toInsert = DefaultLabels
            .Select(label => label.Trim())
            .Where(label => !string.IsNullOrWhiteSpace(label))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Where(label => !existing.Contains(label))
            .Select(label => new ResponsibleOption
            {
                Id = Guid.NewGuid(),
                Label = label,
            })
            .ToList();

        if (toInsert.Count == 0) return;

        db.ResponsibleOptions.AddRange(toInsert);
        await db.SaveChangesAsync(ct);
    }
}
