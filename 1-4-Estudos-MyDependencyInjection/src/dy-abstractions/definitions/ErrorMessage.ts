export class ErrorMessage {
  private constructor() {
  }

  public static get DUPLICATED_INJECTABLE_DECORATOR(): string {
    return 'Cannot apply @Injectable decorator multiple times.';
  }

  public static get ONLY_CONSTRUCTOR_INJECTABLE_PARAM_DECORATOR(): string {
    return '@InjectableParam can be apply ony in constructor of class.';
  }
}