import {
	Component, Inject, OnInit,
	OnDestroy, Injector, ViewChild
} from '@angular/core';
import {
	MatDialogRef, MAT_DIALOG_DATA,
	MatPaginator, MatTableDataSource,
	MatDialog
} from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectPurchaseOrderService } from '@finance/project/services/project-purchase-order.service';
import { ProjectCostItemService } from '@finance/project/services/project-cost-item.service';
import { COST_MODIFICATION_STATUS, PURCHASE_ORDER_STATUS, MODIFIED_STATUS, COLORS } from '@resources';
import { DialogProjectCostItemModifyComponent } from './dialog-project-cost-item-modify.component';

@Component({
	selector	: 'dialog-project-purchase-order-modify',
	templateUrl	: '../templates/dialog-project-purchase-order-modify.pug',
})
export class DialogProjectPurchaseOrderModifyComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

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
		'no', 'status', 'name',
		'amount', 'price',
		'total', 'actions',
	];
	public DISCOUNT_TYPE: Array<any> = [
		{ id: '%', name: '%' },
		{ id: '$', name: '$' },
	];
	public PURCHASE_ORDER_STATUS: any = PURCHASE_ORDER_STATUS;
	public MODIFIED_STATUS: any = MODIFIED_STATUS;

	public modifiedStatus: Array<any> = [
		{
			id		: 0,
			key		: 'ORIGIN',
			name	: 'FINANCE.PROJECT.LABELS.ORIGIN',
			color	: COLORS.ACCENT,
			priority: 3,
		},
		{
			id		: 1,
			key		: 'ADDED',
			name	: 'FINANCE.PROJECT.LABELS.ADDED',
			color	: COLORS.SUCCESS,
			priority: 1,
		},
		{
			id		: 2,
			key		: 'REMOVED',
			name	: 'FINANCE.PROJECT.LABELS.REMOVED',
			color	: COLORS.WARN,
			priority: 0,
		},
		{
			id		: 3,
			key		: 'EDITED',
			name	: 'FINANCE.PROJECT.LABELS.EDITED',
			color	: COLORS.WARNING,
			priority: 2,
		},
	];
	public backupCostItems: Array<any> = [];

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialog} dialog
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectPurchaseOrderService} projectPurchaseOrderService
	* @param {ProjectCostItemService} projectCostItemService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialog						: MatDialog,
		public dialogRef					: MatDialogRef<DialogProjectPurchaseOrderModifyComponent>,
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
	* Update table with rendered status and ordering
	* @return {Array}
	*/
	public renderTable(): Array<any> {
		this.projectPurchaseOrder.selected_total = 0;

		return _.sortBy( _.map(
			this.projectPurchaseOrder.selected_cost_items,
			( item: any, index: number ) => {
				item.total = item.amount * item.price;

				( item.modified_status !== MODIFIED_STATUS.REMOVED )
				&& ( this.projectPurchaseOrder.selected_total += item.total );

				return {
					...item,
					no: index + 1,
					status_name: this.modifiedStatus[ item.modified_status || 0 ],
					ordering: this.modifiedStatus[ item.modified_status || 0 ].priority,
				};
			}
		), 'ordering' );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.projectPurchaseOrder, this.data );
		this.dataSourcePOItem.data = this.renderTable();
		this.backupCostItems = _.map( this.data.selected_cost_items, ( item: any ) => ({ ...item }));

		this.setProcessing( true );

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
				&& item.last_status !== COST_MODIFICATION_STATUS.WAITING ) {
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
	* Update cost item lists after select
	* @param {number} costItemId
	* @return {void}
	*/
	public updateCostItemLists( costItemId: number ) {
		const selectedItem: any = _.findWhere( this.projectPurchaseOrder.remaining_cost_items, { id: costItemId } );

		if ( !selectedItem ) return;
		selectedItem.modified_status = MODIFIED_STATUS.ADDED;

		this.projectPurchaseOrder.selected_cost_items.push( selectedItem );
		this.projectPurchaseOrder.remaining_cost_items = _.reject( this.projectPurchaseOrder.remaining_cost_items, { id: costItemId } );
		this.projectPurchaseOrder.selecting_cost_item_id = null;
		this.dataSourcePOItem.data = this.renderTable();
		this.updateDiscount();
	}

	/**
	* addAllCostItems
	* @return {void}
	*/
	public addAllCostItems() {
		this.projectPurchaseOrder.selected_cost_items = _.union(
			this.projectPurchaseOrder.selected_cost_items,
			_.map( this.projectPurchaseOrder.remaining_cost_items, ( item: any ) => ({ ...item, modified_status: MODIFIED_STATUS.ADDED }))
		);
		this.projectPurchaseOrder.remaining_cost_items = [];
		this.projectPurchaseOrder.selecting_cost_item_id = null;
		this.dataSourcePOItem.data = this.renderTable();
		this.updateDiscount();
	}

	/**
	* Add removed cost item again
	* @param {number} id
	* @return {void}
	*/
	public addAgainCostItem( id: number ) {
		this.projectPurchaseOrder.selected_cost_items = _.map( this.projectPurchaseOrder.selected_cost_items, ( item: any ) => ({
			...item,
			modified_status: ( item.id === id ) ? null : item.modified_status,
		}));
		this.projectPurchaseOrder.selecting_cost_item_id = null;
		this.dataSourcePOItem.data = this.renderTable();
		this.updateDiscount();
	}

	/**
	* Add removed cost item again
	* @param {number} id
	* @return {void}
	*/
	public resetCostItem( id: number ) {
		this.projectPurchaseOrder.selected_cost_items = _.map( this.projectPurchaseOrder.selected_cost_items, ( item: any ) => {
			if ( item.id === id ) {
				const oldItem: any = _.findWhere( this.backupCostItems, { id } );
				item.amount = oldItem.amount;
				item.price = oldItem.price;
				item.total = oldItem.price * oldItem.amount;
				item.modified_status = null;
			}

			return item;
		});
		this.projectPurchaseOrder.selecting_cost_item_id = null;
		this.dataSourcePOItem.data = this.renderTable();
		this.updateDiscount();
	}

	/**
	* Delete cost item lists after clicked
	* @param {number} id
	* @return {void}
	*/
	public deleteSelectedCostItem( id: number ) {
		let tempTotal: number = 0;
		_.each( this.projectPurchaseOrder.selected_cost_items, ( item: any ) => {
			( item.modified_status !== MODIFIED_STATUS.REMOVED && item.id !== id )
			&& ( tempTotal += item.amount * item.price );
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

		const itemDeleting: any = _.findWhere( this.backupCostItems, { id } );

		if ( !itemDeleting ) {
			this.projectPurchaseOrder.remaining_cost_items.push( itemDeleting );
			this.projectPurchaseOrder.selected_cost_items = _.reject( this.projectPurchaseOrder.selected_cost_items, { id } );
		} else {
			this.projectPurchaseOrder.selected_cost_items = _.map( this.projectPurchaseOrder.selected_cost_items, ( item: any ) => ({
				...item,
				modified_status: ( item.id === id ) ? MODIFIED_STATUS.REMOVED : item.modified_status,
			}));
		}

		this.dataSourcePOItem.data = this.renderTable();
		this.updateDiscount();
	}

	/**
	* Open Dialog modify cost item
	* @param {any} data
	* @return {void}
	*/
	public modifyCostItem( data?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogProjectCostItemModifyComponent,
			{
				width: '600px',
				data,
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.projectPurchaseOrder.selected_cost_items = _.map( this.projectPurchaseOrder.selected_cost_items, ( item: any ) => {
				if ( item.id === result.id ) {
					item.amount = result.new_amount;
					item.price = result.new_price;
					item.total = result.new_total;
					item.modified_status = MODIFIED_STATUS.EDITED;
				}
				return item;
			});

			this.dataSourcePOItem.data = this.renderTable();
			this.updateDiscount();
		} );
	}

	/**
	* Update
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.projectPurchaseOrderService
		.modify( this.projectPurchaseOrder.id, this.projectPurchaseOrder )
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
