using CalendarDay.Application.Contracts.Deadlines;
using FluentValidation;

namespace CalendarDay.Application.Validation;

public class CreateDeadlineDtoValidator : AbstractValidator<CreateDeadlineDto>
{
    private static readonly string[] AllowedGroups = ["political", "political_organ", "public"];

    public CreateDeadlineDtoValidator()
    {
        RuleFor(x => x.ElectionId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(350);
        RuleFor(x => x.Description).NotEmpty();
        RuleForEach(x => x.Responsible).NotEmpty();
        RuleForEach(x => x.Group)
            .NotEmpty()
            .Must(group => AllowedGroups.Contains(group))
            .WithMessage("Group must be one of: political, political_organ, public.");
    }
}

public class UpdateDeadlineDtoValidator : AbstractValidator<UpdateDeadlineDto>
{
    public UpdateDeadlineDtoValidator()
    {
        Include(new CreateDeadlineDtoValidator());
    }
}
