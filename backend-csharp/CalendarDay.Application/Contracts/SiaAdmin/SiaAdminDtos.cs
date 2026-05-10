namespace CalendarDay.Application.Contracts.SiaAdmin;

public record SiaLoginRequestDto(
    string UserName,
    string Password
);

public record SiaTokenRequestDto(
    string SessionToken
);

public record SiaTransactionDto(
    string? Code,
    string? Name,
    string? Description
);

public record SiaApplicationDto(
    string? Code,
    string? Name,
    string? Description,
    string? AccessUrl
);

public record SiaRoleDto(
    string? Name,
    string? Description,
    long? CircumscriptionId,
    long? ElectionId,
    IReadOnlyList<SiaTransactionDto> Transactions
);

public record SiaUserInfoDto(
    string? Login,
    string? FirstName,
    string? LastName,
    string? Email,
    string? UserId,
    IReadOnlyList<SiaRoleDto> Roles,
    IReadOnlyList<SiaApplicationDto> Applications
);

public record SiaSessionInfoDto(
    string? Token,
    DateTime? LoginTime,
    DateTime? LastAccessTime,
    DateTime? LogoutTime,
    SiaUserInfoDto? User
);
