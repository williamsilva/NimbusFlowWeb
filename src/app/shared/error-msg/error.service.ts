import { Injectable } from '@angular/core';
import { FormGroup, FormControl, FormArray, AbstractControl } from '@angular/forms';

import { MassageValidations } from './message-validations';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  controlError!: any;

  constructor() {}

  hasErrors(control: any, label: string) {
    for (const propertyName in control.errors) {
      if (control.errors.hasOwnProperty(propertyName) && control.touched) {
        return MassageValidations.getErrorMsg(label, propertyName, control.errors[propertyName]);
      }
    }
    return null;
  }

  hasErrorsMsg(control: any, label: string, required = true) {
    for (const propertyName in control.errors) {
      if (control.errors.hasOwnProperty(propertyName) && control.touched) {
        return MassageValidations.getErrorMsg(label, propertyName, control.errors[propertyName]);
      }
    }

    if (required) {
      return `${label}*`;
    } else {
      return label;
    }
  }

  hasControlErrors(control: any) {
    for (const propertyName in control.errors) {
      if (control.errors.hasOwnProperty(propertyName) && control.touched) {
        return true;
      }
    }
    return false;
  }

  hasInvalidControls(group: AbstractControl): boolean {
    if (group instanceof FormGroup || group instanceof FormArray) {
      return Object.values(group.controls).some((control) => this.hasInvalidControls(control));
    }
    return group.invalid && (group.touched || group.dirty);
  }

  checkFormValidations(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach((control) => {
      if (control instanceof FormControl) {
        control.markAsTouched();
        control.markAsDirty();
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        this.checkFormValidations(control);
      }
    });
  }

  hasClassError(control: any) {
    if (this.hasControlErrors(control)) {
      return 'red';
    }
    return '';
  }
}
