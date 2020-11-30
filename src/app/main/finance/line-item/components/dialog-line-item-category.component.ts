import {
	Component, Inject, Injector,
	OnDestroy, OnInit
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { LineItemCategoryService } from '@finance/line-item/services/line-item-category.service';
import { FinanceBaseComponent } from '@finance/finance-base.component';

@Component({
	selector	: 'dialog-line-item-category',
	templateUrl	: '../templates/dialog-line-item-category.pug',
})
export class DialogLineItemCategoryComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public lineItemCategoryForm: FormGroup;
	public isSubmitting: boolean;
	public lineItemCategory: any = {};

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {LineItemCategoryService} lineItemCategoryService
	* @param {SnackBarService} snackBarService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef				: MatDialogRef<DialogLineItemCategoryComponent>,
		public injector					: Injector,
		public fb						: FormBuilder,
		public lineItemCategoryService	: LineItemCategoryService,
		public snackBarService			: SnackBarService
	) {
		super( injector );

		this.lineItemCategoryForm = fb.group({
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
		this.data && _.assign( this.lineItemCategory, this.data );
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
	* Create line item category
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.lineItemCategoryService
		.create( this.lineItemCategory )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'LINE_ITEM_CATEGORY_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.LINE_ITEM_CATEGORY.MESSAGES.LINE_ITEM_CATEGORY_ALREADY_EXISTS', this.lineItemCategory );
					return;
				}

				this.snackBarService.warn( 'FINANCE.LINE_ITEM_CATEGORY.MESSAGES.CREATE_LINE_ITEM_CATEGORY_FAIL', this.lineItemCategory );
				return;
			}

			this.snackBarService.success( 'FINANCE.LINE_ITEM_CATEGORY.MESSAGES.CREATE_LINE_ITEM_CATEGORY_SUCCESS', this.lineItemCategory );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update line item category
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.lineItemCategoryService
		.update( this.lineItemCategory.id, this.lineItemCategory )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'LINE_ITEM_CATEGORY_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.LINE_ITEM_CATEGORY.MESSAGES.LINE_ITEM_CATEGORY_ALREADY_EXISTS', this.lineItemCategory );
					return;
				}

				this.snackBarService.warn( 'FINANCE.LINE_ITEM_CATEGORY.MESSAGES.UPDATE_LINE_ITEM_CATEGORY_FAIL', this.lineItemCategory );
				return;
			}

			this.snackBarService.success( 'FINANCE.LINE_ITEM_CATEGORY.MESSAGES.UPDATE_LINE_ITEM_CATEGORY_SUCCESS', this.lineItemCategory );

			this.dialogRef.close( true );
		} );
	}

}
