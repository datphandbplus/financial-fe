import {
	Component, Inject, OnInit,
	OnDestroy, Injector, ViewChild
} from '@angular/core';
import {
	MatDialogRef, MAT_DIALOG_DATA,
	MatPaginator, MatTableDataSource
} from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectPurchaseOrderService } from '@finance/project/services/project-purchase-order.service';
import { ProjectCostItemService } from '@finance/project/services/project-cost-item.service';
import { COST_MODIFICATION_STATUS, PURCHASE_ORDER_STATUS } from '@resources';

@Component({
	selector	: 'dialog-project-purchase-order',
	templateUrl	: '../templates/dialog-project-purchase-order.pug',
})
export class DialogProjectPurchaseOrderComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	@ViewChild( 'paginatorPOItem' ) set paginatorPOItem( paginator: MatPaginator ) {
		this.dataSourcePOItem.paginator = paginator;
	}

	public dataSourcePOItem: MatTableDataSource<any> = new MatTableDataSource<any>( [] );
	public projectPurchaseOrderForm: FormGroup;
	public isSubmitting: boolean;
	public projectPurchaseOrder: any = {
		project_id				: null,
		name					: null,
		description				: null,
		note					: null,
		selecting_cost_item_id	: null,
		vat_percent				: 0,
		discount_type			: '%',
		discount_amount			: 0,
		discount_value			: 0,
		discount_remain			: 0,
	};
	public displayedColumns: Array<string> = [
		'no', 'name', 'vendor',
		'unit', 'amount', 'price',
		'total', 'actions',
	];
	public DISCOUNT_TYPE: Array<any> = [
		{ id: '%', name: '%' },
		{ id: '$', name: '$' },
	];
	public PURCHASE_ORDER_STATUS: any = PURCHASE_ORDER_STATUS;

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectPurchaseOrderService} projectPurchaseOrderService
	* @param {ProjectCostItemService} projectCostItemService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef					: MatDialogRef<DialogProjectPurchaseOrderComponent>,
		public injector						: Injector,
		public fb							: FormBuilder,
		public snackBarService				: SnackBarService,
		public projectPurchaseOrderService	: ProjectPurchaseOrderService,
		public projectCostItemService		: ProjectCostItemService
	) {
		super( injector );

		this.projectPurchaseOrderForm = fb.group({
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
			discount_remain			: { value: null, disabled: false },
			discount_value			: { value: null, disabled: false },
			description				: { value: null, disabled: false },
			note					: { value: null, disabled: false },
			selecting_cost_item_id	: { value: null, disabled: false },
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.projectPurchaseOrder, this.data );
		this.dataSourcePOItem.data = _.map(
			this.projectPurchaseOrder.selected_cost_items,
			( item: any, index: number ) => ({ ...item, no: index + 1 })
		);

		this.setProcessing( true );

		this.projectPurchaseOrder.selected_total = 0;
		_.each( this.projectPurchaseOrder.selected_cost_items, ( item: any ) => {
			this.projectPurchaseOrder.selected_total += item.amount * item.price;
		});

		this.projectPurchaseOrder.selected_cost_items[ 0 ]
		&& this.projectPurchaseOrder.selected_cost_items[ 0 ].vendor_id
		&& this.projectCostItemService
		.getAll(
			this.projectPurchaseOrder.project_id,
			'had_vendor_approved',
			{ vendor_id: this.projectPurchaseOrder.selected_cost_items[ 0 ].vendor_id }
		)
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			result = _.filter( result, ( item: any ) => {
				item.last_modification = _.last( item.project_cost_modifications );
				item.last_status = item.last_modification ? item.last_modification.status : COST_MODIFICATION_STATUS.VALID;
				if ( !_.filter( this.projectPurchaseOrder.selected_cost_items, { id: item.id } ).length
					&& item.last_status !== COST_MODIFICATION_STATUS.WAITING
				) {
					item.total = item.price * item.amount;
					return item;
				}
			} );
			this.projectPurchaseOrder.remaining_cost_items = result;
		} );

		const discountRemainControl: any = this.projectPurchaseOrderForm.get( 'discount_remain' );
		discountRemainControl.setValidators([
			Validators.required,
			Validators.min( this.projectPurchaseOrder.planed || 0 ),
		]);
		this.projectPurchaseOrderForm.controls.discount_remain.markAsTouched();
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
	* Update cost item lists after select
	* @param {number} costItemId
	* @return {void}
	*/
	public updateCostItemLists( costItemId: number ) {
		this.projectPurchaseOrder.selected_cost_items = _.union(
			this.projectPurchaseOrder.selected_cost_items,
			_.filter( this.projectPurchaseOrder.remaining_cost_items, { id: costItemId } )
		);
		this.dataSourcePOItem.data = _.map(
			this.projectPurchaseOrder.selected_cost_items,
			( item: any, index: number ) => ({ ...item, no: index + 1 })
		);
		this.projectPurchaseOrder.remaining_cost_items = _.reject( this.projectPurchaseOrder.remaining_cost_items, { id: costItemId } );

		let tempTotal: number = 0;
		_.each( this.projectPurchaseOrder.selected_cost_items, ( item: any ) => {
			tempTotal += item.total;
		} );
		this.projectPurchaseOrder.selected_total = tempTotal;
		this.projectPurchaseOrder.selecting_cost_item_id = null;
		this.updateDiscount();
	}

	/**
	* addAllCostItems
	* @return {void}
	*/
	public addAllCostItems() {
		this.projectPurchaseOrder.selected_cost_items = _.union(
			this.projectPurchaseOrder.selected_cost_items,
			this.projectPurchaseOrder.remaining_cost_items
		);
		this.dataSourcePOItem.data = _.map(
			this.projectPurchaseOrder.selected_cost_items,
			( item: any, index: number ) => ({ ...item, no: index + 1 })
		);
		this.projectPurchaseOrder.remaining_cost_items = [];

		let tempTotal: number = 0;
		_.each( this.projectPurchaseOrder.selected_cost_items, ( item: any ) => {
			tempTotal += item.total;
		} );
		this.projectPurchaseOrder.selected_total = tempTotal;
		this.projectPurchaseOrder.selecting_cost_item_id = null;
		this.updateDiscount();
	}

	/**
	* Update discount
	* @return {void}
	*/
	public updateDiscount() {
		const discountAmountControl: any = this.projectPurchaseOrderForm.get( 'discount_amount' );

		if ( this.projectPurchaseOrder.discount_type === '%' ) {
			discountAmountControl.setValidators([
				Validators.required,
				Validators.min( 0 ),
				Validators.max( 100 ),
			]);

			this.projectPurchaseOrder.discount_value = this.projectPurchaseOrder.selected_total * this.projectPurchaseOrder.discount_amount / 100;
		} else {
			discountAmountControl.setValidators([
				Validators.required,
				Validators.min( 0 ),
				Validators.max( this.projectPurchaseOrder.selected_total ),
			]);

			this.projectPurchaseOrder.discount_value = this.projectPurchaseOrder.discount_amount;
		}
		discountAmountControl.updateValueAndValidity();

		this.projectPurchaseOrder.discount_remain = this.projectPurchaseOrder.selected_total - this.projectPurchaseOrder.discount_value;
		this.projectPurchaseOrderForm.controls.discount_remain.markAsTouched();
	}

	/**
	* Delete cost item lists after clicked
	* @param {number} costItemId
	* @return {void}
	*/
	public deleteSelectedCostItem( costItemId: number ) {
		let tempTotal: number = 0;
		_.each( this.projectPurchaseOrder.selected_cost_items, ( item: any ) => {
			if ( item.id === costItemId ) return;

			tempTotal += item.total;
		} );

		const newDiscountValue: number = ( this.projectPurchaseOrder.discount_type === '$' )
			? this.projectPurchaseOrder.discount_amount
			: this.projectPurchaseOrder.discount_amount * tempTotal / 100;

		if ( this.projectPurchaseOrder.planed
			&& ( tempTotal - newDiscountValue ) < this.projectPurchaseOrder.planed
		) {
			this.snackBarService.warning( 'FINANCE.COST_ITEM.MESSAGES.PROJECT_PURCHASE_ORDER_UNDER_PLANNED', this.projectPurchaseOrder );
			return;
		}

		this.projectPurchaseOrder.remaining_cost_items = _.union(
			this.projectPurchaseOrder.remaining_cost_items,
			_.filter( this.projectPurchaseOrder.selected_cost_items, { id: costItemId } )
		);
		this.projectPurchaseOrder.selected_cost_items = _.reject( this.projectPurchaseOrder.selected_cost_items, { id: costItemId } );
		this.dataSourcePOItem.data = _.map(
			this.projectPurchaseOrder.selected_cost_items,
			( item: any, index: number ) => ({ ...item, no: index + 1 })
		);

		this.projectPurchaseOrder.selected_total = tempTotal;
		this.updateDiscount();
	}

	/**
	* Create
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;
		this.projectPurchaseOrder.selected_cost_items = _.map(
			this.projectPurchaseOrder.selected_cost_items, ( item: any ) => _.pick( item, 'id', 'project_id', 'vendor_id' )
		);
		this.projectPurchaseOrderService
		.create( this.projectPurchaseOrder )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.COST_ITEM.MESSAGES.CREATE_PROJECT_PURCHASE_ORDER_FAIL', this.projectPurchaseOrder );
				return;
			}

			this.snackBarService.success( 'FINANCE.COST_ITEM.MESSAGES.CREATE_PROJECT_PURCHASE_ORDER_SUCCESS', this.projectPurchaseOrder );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;
		this.projectPurchaseOrder.selected_cost_items = _.map(
			this.projectPurchaseOrder.selected_cost_items, ( item: any ) => _.pick( item, 'id', 'project_id', 'vendor_id' )
		);
		this.projectPurchaseOrderService
		.update( this.projectPurchaseOrder.id, this.projectPurchaseOrder )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.COST_ITEM.MESSAGES.UPDATE_PROJECT_PURCHASE_ORDER_FAIL', this.projectPurchaseOrder );
				return;
			}

			this.snackBarService.success( 'FINANCE.COST_ITEM.MESSAGES.UPDATE_PROJECT_PURCHASE_ORDER_SUCCESS', this.projectPurchaseOrder );

			this.dialogRef.close( true );
		} );
	}

}
