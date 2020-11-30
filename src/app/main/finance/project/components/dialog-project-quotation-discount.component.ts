import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectService } from '@finance/project/services/project.service';

@Component({
	selector	: 'dialog-project-quotation-discount',
	templateUrl	: '../templates/dialog-project-quotation-discount.pug',
})
export class DialogProjectQuotationDiscountComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public projectQuotationDiscountForm: FormGroup;
	public isSubmitting: boolean;
	public project: any = {
		discount_type	: '%',
		discount_amount	: 0,
		discount_value	: 0,
		discount_remain	: 0,
	};
	public DISCOUNT_TYPE: Array<any> = [
		{ id: '%', name: '%' },
		{ id: '$', name: '$' },
	];

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectService} projectService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef		: MatDialogRef<DialogProjectQuotationDiscountComponent>,
		public injector			: Injector,
		public fb				: FormBuilder,
		public snackBarService	: SnackBarService,
		public projectService	: ProjectService
	) {
		super( injector );

		this.projectQuotationDiscountForm = fb.group({
			discount_amount: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			discount_type: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			discount_remain	: { value: null, disabled: false },
			discount_value	: { value: null, disabled: false },
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.project, this.data );

		const discountRemainControl: any = this.projectQuotationDiscountForm.get( 'discount_remain' );
		discountRemainControl.setValidators([
			Validators.required,
			Validators.min( this.project.total || 0 ),
		]);
		this.projectQuotationDiscountForm.controls.discount_remain.markAsTouched();
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
	* Update discount
	* @return {void}
	*/
	public updateDiscount() {
		const discountAmountControl: any = this.projectQuotationDiscountForm.get( 'discount_amount' );

		if ( this.project.discount_type === '%' ) {
			discountAmountControl.setValidators([
				Validators.required,
				Validators.min( 0 ),
				Validators.max( 100 ),
			]);

			this.project.discount_value = this.project.subtotal * this.project.discount_amount / 100;
		} else {
			discountAmountControl.setValidators([
				Validators.required,
				Validators.min( 0 ),
				Validators.max( this.project.subtotal ),
			]);

			this.project.discount_value = this.project.discount_amount;
		}
		discountAmountControl.updateValueAndValidity();

		this.project.discount_remain = this.project.subtotal - this.project.discount_value;
		this.projectQuotationDiscountForm.controls.discount_remain.markAsTouched();
	}

	/**
	* Update
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;
		this.projectService
		.updateQuotationDiscount( this.project.id, this.project )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_FAIL', this.project );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_SUCCESS', this.project );

			this.dialogRef.close( this.project );
		} );
	}

}
