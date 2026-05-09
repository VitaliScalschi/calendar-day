using CalendarDay.Application.Contracts.Users;
using CalendarDay.Domain.Entities;
using FluentValidation;

namespace CalendarDay.Application.Validation;

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(role => role is AppRoles.Admin or "SuperAdmin" or AppRoles.Editor or AppRoles.Viewer)
            .WithMessage("Role must be one of: Admin, Editor, Viewer.");
    }
}

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password)
            .MinimumLength(6)
            .When(x => !string.IsNullOrWhiteSpace(x.Password));
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(role => role is AppRoles.Admin or "SuperAdmin" or AppRoles.Editor or AppRoles.Viewer)
            .WithMessage("Role must be one of: Admin, Editor, Viewer.");
    }
}

public class AssignRoleDtoValidator : AbstractValidator<AssignRoleDto>
{
    public AssignRoleDtoValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(role => role is AppRoles.Admin or "SuperAdmin" or AppRoles.Editor or AppRoles.Viewer)
            .WithMessage("Role must be one of: Admin, Editor, Viewer.");
    }
}

public class ChangeUserRoleDtoValidator : AbstractValidator<ChangeUserRoleDto>
{
    public ChangeUserRoleDtoValidator()
    {
        RuleFor(x => x.FromRole)
            .NotEmpty()
            .Must(role => role is AppRoles.Admin or "SuperAdmin" or AppRoles.Editor or AppRoles.Viewer);
        RuleFor(x => x.ToRole)
            .NotEmpty()
            .Must(role => role is AppRoles.Admin or "SuperAdmin" or AppRoles.Editor or AppRoles.Viewer);
    }
}
