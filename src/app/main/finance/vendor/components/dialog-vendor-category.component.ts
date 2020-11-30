import {
	Component, Inject, Injector,
	OnDestroy, OnInit
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { VendorCategoryService } from '@finance/vendor/services/vendor-category.service';
import { FinanceBaseComponent } from '@finance/finance-base.component';

@Component({
	selector	: 'dialog-vendor-category',
	templateUrl	: '../templates/dialog-vendor-category.pug',
})
export class DialogVendorCategoryComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public vendorCategoryForm: FormGroup;
	public isSubmitting: boolean;
	public vendorCategory: any = {};

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {VendorCategoryService} vendorCategoryService
	* @param {SnackBarService} snackBarService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef			: MatDialogRef<DialogVendorCategoryComponent>,
		public injector				: Injector,
		public fb					: FormBuilder,
		public vendorCategoryService: VendorCategoryService,
		public snackBarService		: SnackBarService
	) {
		super( injector );

		this.vendorCategoryForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			description: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.vendorCategory, this.data );
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
	* Create vendor category
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.vendorCategoryService
		.create( this.vendorCategory )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'VENDOR_CATEGORY_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.VENDOR_CATEGORY.MESSAGES.VENDOR_CATEGORY_ALREADY_EXISTS', this.vendorCategory );
					return;
				}

				this.snackBarService.warn( 'FINANCE.VENDOR_CATEGORY.MESSAGES.CREATE_VENDOR_CATEGORY_FAIL', this.vendorCategory );
				return;
			}

			this.snackBarService.success( 'FINANCE.VENDOR_CATEGORY.MESSAGES.CREATE_VENDOR_CATEGORY_SUCCESS', this.vendorCategory );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update vendor category
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.vendorCategoryService
		.update( this.vendorCategory.id, this.vendorCategory )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'VENDOR_CATEGORY_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.VENDOR_CATEGORY.MESSAGES.VENDOR_CATEGORY_ALREADY_EXISTS', this.vendorCategory );
					return;
				}

				this.snackBarService.warn( 'FINANCE.VENDOR_CATEGORY.MESSAGES.UPDATE_VENDOR_CATEGORY_FAIL', this.vendorCategory );
				return;
			}

			this.snackBarService.success( 'FINANCE.VENDOR_CATEGORY.MESSAGES.UPDATE_VENDOR_CATEGORY_SUCCESS', this.vendorCategory );

			this.dialogRef.close( true );
		} );
	}

}
