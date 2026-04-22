using CalendarDay.Application.Contracts.UsefulInfos;
using FluentValidation;

namespace CalendarDay.Application.Validation;

public class CreateUsefulInfoDtoValidator : AbstractValidator<CreateUsefulInfoDto>
{
    private static readonly string[] AllowedTypes = ["page", "external-link", "document", "faq"];

    public CreateUsefulInfoDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(250);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Type)
            .NotEmpty()
            .Must(type => AllowedTypes.Contains(type))
            .WithMessage("Type must be one of: page, external-link, document, faq.");
        RuleFor(x => x.Icon).MaximumLength(120);
        RuleFor(x => x.Order).GreaterThan(0);
    }
}

public class UpdateUsefulInfoDtoValidator : AbstractValidator<UpdateUsefulInfoDto>
{
    public UpdateUsefulInfoDtoValidator()
    {
        Include(new CreateUsefulInfoDtoValidator());
    }
}
