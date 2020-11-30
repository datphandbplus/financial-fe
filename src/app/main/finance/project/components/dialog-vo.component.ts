import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { VOService } from '@finance/project/services/vo.service';

@Component({
	selector	: 'dialog-vo',
	templateUrl	: '../templates/dialog-vo.pug',
})
export class DialogVOComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public voForm: FormGroup;
	public isSubmitting: boolean;
	public vo: any = {
		project_id		: null,
		name			: null,
		note			: null,
		vat_percent		: 0,
		discount_type	: '%',
		discount_amount	: 0,
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
	* @param {VOService} voService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef		: MatDialogRef<DialogVOComponent>,
		public injector			: Injector,
		public fb				: FormBuilder,
		public snackBarService	: SnackBarService,
		public voService		: VOService
	) {
		super( injector );

		this.voForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			vat_percent: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
					Validators.max( 100 ),
				]),
			],
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
			note: { value: null, disabled: false },
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.vo, this.data );

		if ( !this.vo.user || this.vo.user.is_disabled ) this.vo.manage_by = null;
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
		const discountAmountControl: any = this.voForm.get( 'discount_amount' );

		if ( this.vo.discount_type === '%' ) {
			discountAmountControl.setValidators([
				Validators.required,
				Validators.min( 0 ),
				Validators.max( 100 ),
			]);
		} else {
			discountAmountControl.setValidators([
				Validators.required,
				Validators.min( 0 ),
			]);
		}
		discountAmountControl.updateValueAndValidity();
	}

	/**
	* Create project
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.voService
		.create( this.vo )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_VO_FAIL', this.vo );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_VO_SUCCESS', this.vo );

			this.dialogRef.close( result.data );
		} );
	}

	/**
	* Update project
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.voService
		.update( this.vo.id, this.vo )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_VO_FAIL', this.vo );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_VO_SUCCESS', this.vo );

			this.dialogRef.close( true );
		} );
	}

}
