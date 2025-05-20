import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsDateAfter', async: false })
export class IsDateAfterConstraint implements ValidatorConstraintInterface {
  validate(value: Date, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const obj = args.object as Record<string, unknown>;
    const relatedValue = obj[relatedPropertyName] as Date | undefined;
    return !value || !relatedValue || value > relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must be later than ${relatedPropertyName}`;
  }
}

export function IsDateAfter(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (target: object, propertyName: string | symbol) {
    registerDecorator({
      name: 'IsDateAfter',
      target: target.constructor,
      propertyName: propertyName as string,
      constraints: [property],
      options: validationOptions,
      validator: IsDateAfterConstraint,
    });
  };
}
