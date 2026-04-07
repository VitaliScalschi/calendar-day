using CalendarDay.Application.Contracts.Users;
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
            .Must(role => role is "SuperAdmin" or "Editor" or "Viewer")
            .WithMessage("Role must be one of: SuperAdmin, Editor, Viewer.");
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
            .Must(role => role is "SuperAdmin" or "Editor" or "Viewer")
            .WithMessage("Role must be one of: SuperAdmin, Editor, Viewer.");
    }
}
