import {
	Component, Inject, Injector,
	OnDestroy, OnInit, ChangeDetectorRef
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import {
	FormGroup, FormBuilder,
	FormArray, Validators
} from '@angular/forms';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import _ from 'underscore';

import { VendorCategoryService } from '@finance/vendor/services/vendor-category.service';
import { VendorService } from '@finance/vendor/services/vendor.service';
import { FinanceBaseComponent } from '@finance/finance-base.component';
import { PROVINCE_MAP, REGEXES } from '@resources';
import { DialogConfirmComponent } from '@core';

@Component({
	selector	: 'dialog-vendor',
	templateUrl	: '../templates/dialog-vendor.pug',
})
export class DialogVendorComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public vendorForm: FormGroup;
	public isSubmitting: boolean;
	public maxContacts: number = 20;
	public vendor: any = { contact_list: [], payment_term: 0 };
	public PROVINCE_MAP: any = PROVINCE_MAP;
	public contactListControl: Array<boolean> = [];

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {VendorCategoryService} vendorCategoryService
	* @param {VendorService} vendorService
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {MatDialog} dialog
	* @param {ChangeDetectorRef} cdRef
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef			: MatDialogRef<DialogVendorComponent>,
		public injector				: Injector,
		public fb					: FormBuilder,
		public vendorCategoryService: VendorCategoryService,
		public vendorService		: VendorService,
		public snackBarService		: SnackBarService,
		public translateService		: TranslateService,
		public dialog				: MatDialog,
		public cdRef				: ChangeDetectorRef
	) {
		super( injector );

		this.vendorForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			short_name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			phone: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			payment_term: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
					Validators.pattern( REGEXES.INT_NUMBER ),
				]),
			],
			tax: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			address: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			bank_name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			bank_branch: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			bank_account_number: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			vendor_category_id	: [{ value: null, disabled: false }],
			bank_province		: [{ value: null, disabled: false }],
			description			: [{ value: null, disabled: false }],
			contact_list		: this.fb.array( [] ),
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.vendor, this.data );

		_.each( this.vendor.contact_list, () => {
			const control: FormArray = <FormArray> this.vendorForm.controls.contact_list;

			control.push( this.getVendorContactFB() );
			this.contactListControl.push( true );
			this.cdRef.detectChanges();
		} );
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
	* Create vendor
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.vendorService
		.create( this.vendor )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'VENDOR_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.VENDOR.MESSAGES.VENDOR_ALREADY_EXISTS', this.vendor );
					return;
				}

				this.snackBarService.warn( 'FINANCE.VENDOR.MESSAGES.CREATE_VENDOR_FAIL', this.vendor );
				return;
			}

			this.snackBarService.success( 'FINANCE.VENDOR.MESSAGES.CREATE_VENDOR_SUCCESS', this.vendor );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update vendor
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.vendorService
		.update( this.vendor.id, this.vendor )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'VENDOR_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.VENDOR.MESSAGES.VENDOR_ALREADY_EXISTS', this.vendor );
					return;
				}

				this.snackBarService.warn( 'FINANCE.VENDOR.MESSAGES.UPDATE_VENDOR_FAIL', this.vendor );
				return;
			}

			this.snackBarService.success( 'FINANCE.VENDOR.MESSAGES.UPDATE_VENDOR_SUCCESS', this.vendor );

			this.dialogRef.close( true );
		} );
	}

		/**
	* Get contact form builder
	* @return {void}
	*/
	public getVendorContactFB() {
		return this.fb.group({
			info: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
		});
	}

	/**
	* Add vendor contact
	* @return {void}
	*/
	public addVendorContactFB() {
		const control: FormArray = <FormArray> this.vendorForm.controls.contact_list;

		this.vendor.contact_list.push( '' );
		this.contactListControl.push( false );

		control.push( this.getVendorContactFB() );
	}

	/**
	* Remove vendor contact
	* @param {number} i
	* @return {void}
	*/
	public removeVendorContactFB( i: number ) {
		const dialogRef2: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.VENDOR.TITLES.DELETE_CONTACT' ),
					content	: this.translateService.instant( 'FINANCE.VENDOR.MESSAGES.DELETE_CONTACT_CONFIRMATION' ),
					actions: {
						yes: { color: 'warn' },
					},
				},
			}
		);

		dialogRef2
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			const control: FormArray = <FormArray> this.vendorForm.controls.contact_list;

			this.vendor.contact_list.splice( i, 1 );
			this.contactListControl.splice( i, 1 );
			control.removeAt( i );
		} );
	}

	/**
	* Edit vendor contact
	* @param {number} i
	* @return {void}
	*/
	public editContactList( i: number ) {
		this.contactListControl[ i ] = !this.contactListControl[ i ];
	}

	/**
	* Is editing form
	* @return {boolean}
	*/
	public isEditing() {
		return _.contains( this.contactListControl, false );
	}

}
