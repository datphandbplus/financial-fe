import {
	Component, Inject, Injector,
	OnDestroy, OnInit
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { CostItemCategoryService } from '@finance/cost-item/services/cost-item-category.service';
import { FinanceBaseComponent } from '@finance/finance-base.component';

@Component({
	selector	: 'dialog-cost-item-category',
	templateUrl	: '../templates/dialog-cost-item-category.pug',
})
export class DialogCostItemCategoryComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public costItemCategoryForm: FormGroup;
	public isSubmitting: boolean;
	public costItemCategory: any = {};

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {CostItemCategoryService} costItemCategoryService
	* @param {SnackBarService} snackBarService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef				: MatDialogRef<DialogCostItemCategoryComponent>,
		public injector					: Injector,
		public fb						: FormBuilder,
		public costItemCategoryService	: CostItemCategoryService,
		public snackBarService			: SnackBarService
	) {
		super( injector );

		this.costItemCategoryForm = fb.group({
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
		this.data && _.assign( this.costItemCategory, this.data );
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
	* Create cost item category
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.costItemCategoryService
		.create( this.costItemCategory )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'COST_ITEM_NOT_FOUND' ) {
					this.snackBarService.warning( 'FINANCE.COST_ITEM.MESSAGES.COST_ITEM_NOT_FOUND' );
					return;
				}

				if ( result && result.message === 'VENDOR_NOT_FOUND' ) {
					this.snackBarService.warning( 'FINANCE.VENDOR.MESSAGES.VENDOR_NOT_FOUND' );
					return;
				}

				if ( result && result.message === 'COST_ITEM_CATEGORY_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.COST_ITEM_CATEGORY.MESSAGES.COST_ITEM_CATEGORY_ALREADY_EXISTS', this.costItemCategory );
					return;
				}

				this.snackBarService.warn( 'FINANCE.COST_ITEM_CATEGORY.MESSAGES.CREATE_COST_ITEM_CATEGORY_FAIL', this.costItemCategory );
				return;
			}

			this.snackBarService.success( 'FINANCE.COST_ITEM_CATEGORY.MESSAGES.CREATE_COST_ITEM_CATEGORY_SUCCESS', this.costItemCategory );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update cost item category
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.costItemCategoryService
		.update( this.costItemCategory.id, this.costItemCategory )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'COST_ITEM_NOT_FOUND' ) {
					this.snackBarService.warning( 'FINANCE.COST_ITEM.MESSAGES.COST_ITEM_NOT_FOUND' );
					return;
				}

				if ( result && result.message === 'VENDOR_NOT_FOUND' ) {
					this.snackBarService.warning( 'FINANCE.VENDOR.MESSAGES.VENDOR_NOT_FOUND' );
					return;
				}

				if ( result && result.message === 'COST_ITEM_CATEGORY_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.COST_ITEM_CATEGORY.MESSAGES.COST_ITEM_CATEGORY_ALREADY_EXISTS', this.costItemCategory );
					return;
				}

				this.snackBarService.warn( 'FINANCE.COST_ITEM_CATEGORY.MESSAGES.UPDATE_COST_ITEM_CATEGORY_FAIL', this.costItemCategory );
				return;
			}

			this.snackBarService.success( 'FINANCE.COST_ITEM_CATEGORY.MESSAGES.UPDATE_COST_ITEM_CATEGORY_SUCCESS', this.costItemCategory );

			this.dialogRef.close( true );
		} );
	}

}
