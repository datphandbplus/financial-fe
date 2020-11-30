import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectCostItemService } from '@finance/project/services/project-cost-item.service';
import { CostItemCategoryService } from '@finance/cost-item/services/cost-item-category.service';
import { VendorCategoryService } from '@finance/vendor/services/vendor-category.service';
import { VendorService } from '@finance/vendor/services/vendor.service';
import { SheetService } from '@finance/project/services/sheet.service';
import { ProjectLineItemService } from '@finance/project/services/project-line-item.service';
import { ProjectCostModificationService } from '@finance/project/services/project-cost-modification.service';

@Component({
	selector	: 'dialog-project-cost-item-modify',
	templateUrl	: '../templates/dialog-project-cost-item-modify.pug',
})
export class DialogProjectCostItemModifyComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public costItemForm: FormGroup;
	public loaded: boolean;
	public isSubmitting: boolean;
	public vendorList: Array<any> = [];
	public lineItemBackup: any = {};
	public lineItem: any = {
		project_sheet_id: null,
		group			: null,
		id				: null,
	};
	public projectID: number;
	public lineItemList: Array<any> = [];
	public lineItemListBackup: Array<any> = [];
	public groupList: Array<any> = [];
	public childGroupList: Array<any> = [];
	public costItem: any = {};

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectCostItemService} projectCostItemService
	* @param {CostItemCategoryService} costItemCategoryService
	* @param {VendorCategoryService} vendorCategoryService
	* @param {VendorService} vendorService
	* @param {SheetService} projectSheetService
	* @param {ProjectLineItemService} projectLineItemService
	* @param {ProjectCostModificationService} projectCostModificationService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef						: MatDialogRef<DialogProjectCostItemModifyComponent>,
		public injector							: Injector,
		public fb								: FormBuilder,
		public snackBarService					: SnackBarService,
		public projectCostItemService			: ProjectCostItemService,
		public costItemCategoryService			: CostItemCategoryService,
		public vendorCategoryService			: VendorCategoryService,
		public vendorService					: VendorService,
		public projectSheetService				: SheetService,
		public projectLineItemService			: ProjectLineItemService,
		public projectCostModificationService	: ProjectCostModificationService
	) {
		super( injector );

		this.costItemForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			unit: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			amount: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			price: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			total: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			new_amount: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			new_price: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			new_total: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.costItem, this.data );

		this.costItem.new_amount = this.costItem.amount;
		this.costItem.new_price = this.costItem.price;
		this.costItem.new_total = this.costItem.total;
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
	* Click Save button event
	* @return {void}
	*/
	public update() {
		this.dialogRef.close( this.costItem );
	}

	/**
	* Update Total
	* @return {void}
	*/
	public updateTotal() {
		this.costItem.total = this.costItem.amount * this.costItem.price;
		this.costItem.new_total = this.costItem.new_amount * this.costItem.new_price;
	}

}
