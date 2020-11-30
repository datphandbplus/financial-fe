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
import { QUOTATION_STATUS } from '@resources';

@Component({
	selector	: 'dialog-project-cost-item',
	templateUrl	: '../templates/dialog-project-cost-item.pug',
})
export class DialogProjectCostItemComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

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
		public dialogRef						: MatDialogRef<DialogProjectCostItemComponent>,
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
			cost_item_category_id	: [{ value: null, disabled: false }],
			total					: [{ value: null, disabled: false }],
			vendor_category_id		: [{ value: null, disabled: false }],
			vendor_id				: [{ value: null, disabled: false }],
			description				: [{ value: null, disabled: false }],
			note					: [{ value: null, disabled: false }],
			project_sheet_id		: [{ value: null, disabled: false }],
			line_item_group			: [{ value: null, disabled: false }],
			project_line_item_id	: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.costItem, this.data );

		this.costItem.project_id = this.projectID = this.data.project_id;
		this.getLineItemList();
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
	* Get LineItemList
	* @return {void}
	*/
	public getLineItemList() {
		this.isSubmitting = true;

		this.projectLineItemService
		.getAll( 'reference', { project_id: this.projectID } )
		.subscribe( ( result: any ) => {
			this.lineItemListBackup = result;

			if ( this.costItem.project_line_item ) {
				this.lineItem = this.costItem.project_line_item;
				this.lineItemBackup = _.clone( this.lineItem );
			}
			this.isSubmitting = false;
		} );
	}

	/**
	* Update Total
	* @return {void}
	*/
	public updateTotal() {
		this.costItem.total = this.costItem.amount * this.costItem.price;
	}

	/**
	* Update VendorList
	* @param {number} vendorCategoryId
	* @return {void}
	*/
	public updateVendorList( vendorCategoryId: number = null ) {
		this.isSubmitting = true;

		this.vendorService
		.getAll( 'category', vendorCategoryId )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			this.vendorList = _.map( result, ( item: any ) => {
				return {
					id	: item.id,
					name: item.short_name,
				};
			} );

			if ( this.costItem.vendor_category_id !== this.data.vendor_category_id ) this.costItem.vendor_id = null;
		} );
	}

	/**
	* Update LineItemList
	* @return {void}
	*/
	public updateLineItemList() {
		this.isSubmitting = true;

		this.lineItemList = [];
		this.groupList = [];
		this.childGroupList = [];

		if ( this.lineItem.project_sheet_id ) {
			this.lineItemList = _.where( this.lineItemListBackup, { project_sheet_id: this.lineItem.project_sheet_id } );
		}

		_.each( this.lineItemList, ( item: any ) => {
			item.group
			&& !_.findWhere( this.groupList, { id: item.group } )
			&& this.groupList.push({
				id	: item.group,
				name: item.group,
			});
		} );
		this.lineItemList = _.where( this.lineItemList, { group: this.lineItem.group } );

		if ( this.data.project_line_item
			&& ( this.lineItem.project_sheet_id !== this.lineItemBackup.project_sheet_id
			|| this.lineItem.group !== this.lineItemBackup.group ) ) this.lineItem.id = null;

		this.isSubmitting = false;
	}

	/**
	* Create project cost item
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.projectCostItemService
		.create( this.costItem )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_COST_ITEM_FAIL', this.costItem );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_COST_ITEM_SUCCESS', this.costItem );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update project cost item's vendor
	* @return {void}
	*/
	public updateVendor() {
		this.isSubmitting = true;

		this.projectCostItemService
		.updateVendor( this.costItem.id, this.costItem )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_COST_ITEM_FAIL', this.costItem );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_COST_ITEM_SUCCESS', this.costItem );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update project cost item
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		if ( this.costItem.project_quotation_status === QUOTATION_STATUS.APPROVED
			&& !this.costItem.parent_id ) {
			this.projectCostModificationService
			.modifyCost( this.costItem.id, this.costItem )
			.subscribe( ( result: any ) => {
				this.isSubmitting = false;

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_COST_ITEM_FAIL', this.costItem );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_COST_ITEM_SUCCESS', this.costItem );

				this.dialogRef.close( true );
			} );

			return;
		}

		this.projectCostItemService
		.update(
			this.costItem.id,
			{
				...this.costItem,
				project_line_item_id: this.lineItem.id,
			}
		)
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_COST_ITEM_FAIL', this.costItem );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_COST_ITEM_SUCCESS', this.costItem );

			this.dialogRef.close( true );
		} );
	}

}
