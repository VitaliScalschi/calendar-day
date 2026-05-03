using CalendarDay.Application.Contracts.Elections;
using FluentValidation;

namespace CalendarDay.Application.Validation;

public class CreateElectionDtoValidator : AbstractValidator<CreateElectionDto>
{
    public CreateElectionDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(250);
        RuleFor(x => x.ElectionTypeIds)
            .NotNull()
            .Must(ids => ids!.Count > 0)
            .WithMessage("Selectați cel puțin un tip de scrutin.");
    }
}

public class UpdateElectionDtoValidator : AbstractValidator<UpdateElectionDto>
{
    public UpdateElectionDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(250);
        RuleFor(x => x.ElectionTypeIds)
            .NotNull()
            .Must(ids => ids!.Count > 0)
            .WithMessage("Selectați cel puțin un tip de scrutin.");
    }
}
