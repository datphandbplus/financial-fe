import {
	Component, Inject, OnInit,
	OnDestroy, Injector,
	ViewChild, ElementRef
} from '@angular/core';
import {
	FormGroup, FormBuilder, Validators
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';
import moment from 'moment-timezone';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectService } from '@finance/project/services/project.service';
import { ProjectPaymentService } from '@finance/project/services/project-payment.service';
import { TRANSFER_TYPE } from '@resources';

@Component({
	selector	: 'dialog-request-payment',
	templateUrl	: '../templates/dialog-request-payment.pug',
})
export class DialogRequestPaymentComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	@ViewChild( 'fileInput' ) public fileInput: ElementRef;

	public loaded: boolean;
	public isSubmitting: boolean;
	public isUploading: boolean;
	public uploadedFile: any;
	public requestForm: FormGroup;
	public RATIO: Array<number> = _.range( 0, 105, 5 );
	public ratioPercent: number = this.RATIO[ 2 ]; // 10%
	public vatPercent: number = this.RATIO[ 2 ]; // 10%
	public sumRequest: any = { total: 0, total_vat: 0 };
	public minExpectedDate: any = moment();
	public requestPayment: any = { new_invoice: null, transfer_type: TRANSFER_TYPE.CASH };
	public transferType: Array<any> = [
		{
			id	: TRANSFER_TYPE.CASH,
			name: 'FINANCE.PROJECT.LABELS.CASH',
		},
		{
			id	: TRANSFER_TYPE.BANKING_TRANSFER,
			name: 'FINANCE.PROJECT.LABELS.BANKING_TRANSFER',
		},
		{
			id	: TRANSFER_TYPE.OTHER,
			name: 'GENERAL.LABELS.OTHER',
		},
	];

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectService} projectService
	* @param {ProjectPaymentService} projectPaymentService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef				: MatDialogRef<DialogRequestPaymentComponent>,
		public injector					: Injector,
		public fb						: FormBuilder,
		public snackBarService			: SnackBarService,
		public projectService			: ProjectService,
		public projectPaymentService	: ProjectPaymentService
	) {
		super( injector );

		const valid_duration = parseInt(data.valid_duration) - 1;

		this.minExpectedDate.add(valid_duration, 'day');

		this.requestForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			invoice_number: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.maxLength( 255 ),
				]),
			],
			invoice_date: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			invoice_note	: [{ value: null, disabled: false }],
			total			: [{ value: null, disabled: false }],
			total_vat		: [{ value: null, disabled: false }],
			sum_with_vat	: [{ value: null, disabled: false }],
			vat				: [{ value: null, disabled: false }],
			ratio			: [{ value: null, disabled: false }],
			transfer_type	: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.requestPayment, this.data );

		const totalControl: any = this.requestForm.get( 'total' );
		const paymentRemaining: number = this.requestPayment.remaining >= 0 ? this.requestPayment.remaining : 0;

		totalControl.setValidators([
			Validators.required,
			Validators.min( 1 ),
			Validators.max( paymentRemaining ),
		]);

		totalControl.updateValueAndValidity();

		const sumWithVatControl: any = this.requestForm.get( 'sum_with_vat' );
		const totalVATRemaining: number = this.requestPayment.vat_remaining >= 0 ? this.requestPayment.vat_remaining : 0;

		sumWithVatControl.setValidators([
			Validators.min( 1 ),
			Validators.max( paymentRemaining + totalVATRemaining ),
		]);

		sumWithVatControl.updateValueAndValidity();

		const totalVatControl: any = this.requestForm.get( 'total_vat' );

		totalVatControl.setValidators([
			Validators.required,
			Validators.min( 0 ),
			Validators.max( this.requestPayment.po_vat_percent === 0 ? 0 : totalVATRemaining ),
		]);

		totalControl.updateValueAndValidity();

		this.sumRequest.total_vat = Math.min(
			totalVATRemaining,
			paymentRemaining * this.ratioPercent / 100
		);
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		super.ngOnDestroy();
	}

	/**
	* Click No button event
	* @return {void}
	*/
	public onNoClick() {
		this.dialogRef.close();
	}

	/**
	* Update Total
	* @return {void}
	*/
	public updateTotal() {
		this.sumRequest.total = Math.min( this.requestPayment.remaining, this.requestPayment.total * this.ratioPercent / 100 );
		this.sumRequest.total_vat = Math.min( this.requestPayment.vat_remaining, this.sumRequest.total * this.vatPercent / 100 );
	}

	/**
	* Update Total VAT
	* @return {void}
	*/
	public updateTotalVAT() {
		this.sumRequest.total_vat = Math.min( this.requestPayment.vat_remaining, this.sumRequest.total * this.vatPercent / 100 );
	}

	/**
	* Create project
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.requestPayment.total = this.sumRequest.total;
		this.requestPayment.total_vat = this.sumRequest.total_vat;

		this.projectPaymentService
		.create( this.requestPayment )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result.message === 'PROJECT_PAYMENT_OVER' ) {
					this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PROJECT_PAYMENT_OVER', this.requestPayment );
					return;
				}

				if ( result.message === 'PROJECT_PAYMENT_VAT_OVER' ) {
					this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PAYMENT_VAT_OVER', this.requestPayment );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_PAYMENT_FAIL', this.requestPayment );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_PAYMENT_SUCCESS', this.requestPayment );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Handle upload contract file
	* @param {any} event
	* @return {void}
	*/
	public onFileSelected( event: any ) {
		this.isUploading = true;

		this.projectService
		.uploadInvoice( event.file )
		.subscribe( ( result: any ) => {
			this.isUploading = false;
			event.input.nativeElement.value = null;

			if ( !result || !result.status ) {
				this.uploadedFile = null;

				if ( result && result.message === 'INVALID_FILE_TYPE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_TYPE' );
					return;
				}

				if ( result && result.message === 'INVALID_FILE_SIZE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_SIZE' );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPLOAD_INVOICE_FAIL' );
				return;
			}

			this.uploadedFile = result.data && result.data[ 0 ];
			this.requestPayment.new_invoice = {
				location: this.uploadedFile.location,
				path	: this.uploadedFile.path,
				key		: this.uploadedFile.key,
				note	: null,
			};
		} );
	}

}
