export interface SelectOptionGroup<T = string> {
  label: string;
  description: string;
  value: T;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}
