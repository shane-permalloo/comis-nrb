import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { VerifyService } from './verify.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputText,
    Select,
    DatePicker,
    Button,
    Dialog,
    TableModule,
    ToggleSwitch,
    FormsModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private fb = inject(FormBuilder);
  private api = inject(VerifyService);
  private cdr = inject(ChangeDetectorRef);

  form = this.fb.group({
    firstname: ['', Validators.required],
    surname: ['', Validators.required],
    othernames: [''],
    dob: ['2000-01-01', Validators.required],
    gender: ['', Validators.required],
    nid: ['', Validators.required],
    designation: [''],
    termOfUse: [''],
    email: [''],
    phone: [''],
    address: ['']
  });

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' }
  ];

  designationOptions = [
    { label: 'Chairperson', value: 'Chairperson' },
    { label: 'Secretary', value: 'Secreatary' },
    { label: 'Treasurer', value: 'Treasurer' },
    { label: 'Member', value: 'Member' },
    { label: 'Employee', value: 'Employee' }
  ];

  termOfUseOptions = [
    { value: '1', label: '1 Year' },
    { value: '2', label: '2 Years' },
    { value: '3', label: '3 Years' },
    { value: '4', label: '4 Years' },
    { value: '5', label: '5 Years' },
    { value: '5+', label: '5+ Years' }
  ];

  result: any = null;
  loading = false;
  showDialog = false;
  useLiveNrb = false;
  maxDob: Date;

  testData = [
    { idno: 'MA845876', firstname: 'LOVE', othernames: '', surname: 'GRACE', gender: 'Female', dob: '01/January/1990', expiry: '01/January/2080', status: 'VALID' },
    { idno: 'AA55DDFF', firstname: 'BRUCE', othernames: '', surname: 'PROMISE', gender: 'Male', dob: '15/June/1990', expiry: '01/January/2080', status: 'VALID' },
    { idno: 'MINOR001', firstname: 'TOM', othernames: '', surname: 'YOUNG', gender: 'Male', dob: '01/January/2012', expiry: '01/January/2080', status: 'VALID (Minor)' },
    { idno: 'EXP00148', firstname: 'JANE', othernames: '', surname: 'OLD', gender: 'Female', dob: '01/May/1988', expiry: '01/January/2020', status: 'EXPIRED' },
    { idno: 'DEC00199', firstname: 'BLACKNEZ', othernames: 'AGO', surname: 'POPE', gender: 'Male', dob: '01/January/1900', expiry: '01/January/1930', status: 'PERSON DECEASED' },
    { idno: 'INV00122', firstname: 'MARK', othernames: '', surname: 'BAD', gender: 'Male', dob: '01/January/1985', expiry: '01/January/2030', status: 'INVALID' },
    { idno: 'REN00233', firstname: 'SARAH', othernames: '', surname: 'RENEWED', gender: 'Female', dob: '10/March/1992', expiry: '01/January/2022', status: 'RENEWAL PROCESSED' },
    { idno: 'SNR00344', firstname: 'PETER', othernames: '', surname: 'FLAGGED', gender: 'Male', dob: '20/August/1995', expiry: '01/September/2035', status: 'SEE NRB' }
  ];

  constructor() {
    const today = new Date();
    this.maxDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  submit() {
    this.loading = true;
    this.result = null;
    this.showDialog = false;
    const val = this.form.value;
    const payload = {
      ...val,
      dob: val.dob ? this.formatDate(val.dob as any) : '',
      useMock: !this.useLiveNrb
    };
    this.api.verifyMember(payload).subscribe({
      next: (r) => {
        this.result = r;
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showDialog = true;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.result = { success: false, errors: ['Request failed'] };
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showDialog = true;
          this.cdr.detectChanges();
        });
      }
    });
  }

  closeDialog() {
    this.showDialog = false;
  }

  cancel() {
    this.form.reset();
    this.result = null;
    this.showDialog = false;
  }

  private formatDate(d: Date | string): string {
    if (typeof d === 'string') return d;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
