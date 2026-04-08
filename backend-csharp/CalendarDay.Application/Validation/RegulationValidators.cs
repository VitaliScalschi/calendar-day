using CalendarDay.Application.Contracts.Regulations;
using FluentValidation;

namespace CalendarDay.Application.Validation;

public class CreateRegulationDtoValidator : AbstractValidator<CreateRegulationDto>
{
    public CreateRegulationDtoValidator()
    {
        RuleFor(x => x.DeadlineId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(350);
    }
}

public class UpdateRegulationDtoValidator : AbstractValidator<UpdateRegulationDto>
{
    public UpdateRegulationDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(350);
    }
}
