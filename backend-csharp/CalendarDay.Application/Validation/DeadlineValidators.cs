using CalendarDay.Application.Contracts.Deadlines;
using FluentValidation;

namespace CalendarDay.Application.Validation;

public class CreateDeadlineDtoValidator : AbstractValidator<CreateDeadlineDto>
{
    public CreateDeadlineDtoValidator()
    {
        RuleFor(x => x.ElectionId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(350);
        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.Deadline) || x.Deadlines.Count > 0)
            .WithMessage("Either deadline or deadlines is required.");
        RuleForEach(x => x.Deadlines).NotEmpty();
        RuleFor(x => x.Description).MaximumLength(4000);
        RuleForEach(x => x.NotificationEmails)
            .EmailAddress()
            .MaximumLength(320);
        RuleFor(x => x.NotificationEmails).Must(list => list.Count <= 50)
            .WithMessage("Maximum 50 notification emails are allowed.");
        RuleForEach(x => x.Responsible).NotEmpty();
        RuleForEach(x => x.Group).NotEmpty();
    }
}

public class UpdateDeadlineDtoValidator : AbstractValidator<UpdateDeadlineDto>
{
    public UpdateDeadlineDtoValidator()
    {
        Include(new CreateDeadlineDtoValidator());
    }
}
