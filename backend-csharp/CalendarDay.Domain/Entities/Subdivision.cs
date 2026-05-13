namespace CalendarDay.Domain.Entities;

/// <summary>
/// Subdiviziune CEC (direcție/serviciu) — nomenclator pentru emitentul unor
/// regulamente, instrucțiuni sau documente.
/// </summary>
public class Subdivision
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
