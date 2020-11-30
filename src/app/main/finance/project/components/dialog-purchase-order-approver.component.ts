import {
	Component, Inject, OnInit,
	OnDestroy, Injector, ViewChild,
	ViewEncapsulation
} from '@angular/core';
import {
	MatDialogRef, MAT_DIALOG_DATA,
	MatTableDataSource, MatPaginator
} from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { PurchaseOrderApproverService } from '@finance/project/services/purchase-order-approver.service';
import {
	PURCHASE_ORDER_APPROVE_STATUS, COLORS,
	MODIFIED_STATUS, PURCHASE_ORDER_STATUS
} from '@resources';

@Component({
	selector		: 'dialog-purchase-order-approver',
	templateUrl		: '../templates/dialog-purchase-order-approver.pug',
	styleUrls		: [ '../styles/dialog-purchase-order-approver.scss' ],
	encapsulation	: ViewEncapsulation.None,
})
export class DialogPurchaseOrderApproverComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	@ViewChild( 'paginatorPOItem' ) set paginatorPOItem( paginator: MatPaginator ) {
		this.dataSourcePOItem.paginator = paginator;
	}

	public dataSourcePOItem: MatTableDataSource<any> = new MatTableDataSource<any>( [] );
	public purchaseOrder: any = {
		name			: null,
		id				: null,
		current_approver: null,
	};
	public selectedTabIndex: number = 0;
	public purchaseOrderApproverForm: FormGroup;
	public isSubmitting: boolean;
	public PURCHASE_ORDER_APPROVE_STATUS: any = PURCHASE_ORDER_APPROVE_STATUS;
	public approvers: any = {
		procurement_manager	: {},
		project_manager		: {},
		ceo					: {},
	};
	public statusList: Array<any> = [
		{
			id		: PURCHASE_ORDER_APPROVE_STATUS.WAITING_APPROVAL,
			key		: 'WAITING_APPROVAL',
			name	: 'FINANCE.PROJECT.LABELS.WAITING_APPROVAL',
			color	: COLORS.WARNING,
		},
		{
			id		: PURCHASE_ORDER_APPROVE_STATUS.APPROVED,
			key		: 'APPROVED',
			name	: 'FINANCE.PROJECT.LABELS.APPROVED',
			color	: COLORS.SUCCESS,
		},
		{
			id		: PURCHASE_ORDER_APPROVE_STATUS.REJECTED,
			key		: 'REJECTED',
			name	: 'FINANCE.PROJECT.LABELS.REJECTED',
			color	: COLORS.WARN,
		},
	];
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
	public displayedColumns: Array<string> = [
		'status', 'name',
		'amount', 'price', 'total',
	];

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {PurchaseOrderApproverService} purchaseOrderApproverService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef					: MatDialogRef<DialogPurchaseOrderApproverComponent>,
		public injector						: Injector,
		public fb							: FormBuilder,
		public snackBarService				: SnackBarService,
		public purchaseOrderApproverService	: PurchaseOrderApproverService
	) {
		super( injector );

		this.purchaseOrderApproverForm = fb.group({
			procurement_manager_status	: [{ value: null, disabled: false }],
			procurement_manager_comment	: [{ value: null, disabled: false }],
			project_manager_status		: [{ value: null, disabled: false }],
			project_manager_comment		: [{ value: null, disabled: false }],
			ceo_status					: [{ value: null, disabled: false }],
			ceo_comment					: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.purchaseOrder, this.data );
		this.purchaseOrder = this.data.project_purchase_order;

		const oldData: Array<any> = this.purchaseOrder.old_data && JSON.parse( this.purchaseOrder.old_data ) || [];
		const oldDataObj: any = {};
		_.each( oldData, ( item: any ) => {
			oldDataObj[ item.id ] = item;
		});

		this.purchaseOrder.total = 0;
		this.purchaseOrder.selected_cost_items = _.sortBy( _.map(
			this.purchaseOrder.status === PURCHASE_ORDER_STATUS.MODIFIED
				? JSON.parse( this.purchaseOrder.new_data )
				: this.purchaseOrder.selected_cost_items, ( costItem: any ) => {
			costItem.total = costItem.amount * costItem.price;

			if ( costItem.modified_status !== MODIFIED_STATUS.REMOVED ) {
				this.purchaseOrder.total += costItem.total;
			}

			if ( costItem.modified_status === MODIFIED_STATUS.EDITED && oldDataObj[ costItem.id ] ) {
				costItem.old_amount = oldDataObj[ costItem.id ].amount;
				costItem.old_price = oldDataObj[ costItem.id ].price;
				costItem.old_total = oldDataObj[ costItem.id ].price * oldDataObj[ costItem.id ].amount;
			}
			costItem.modified_status_name = this.modifiedStatus[ costItem.modified_status || 0 ];
			costItem.ordering = this.modifiedStatus[ costItem.modified_status || 0 ].priority;

			return costItem;
		}), 'ordering' );
		this.purchaseOrder.discount_value = ( this.purchaseOrder.discount_type === '%' )
			? ( this.purchaseOrder.total * this.purchaseOrder.discount_amount / 100 )
			: this.purchaseOrder.discount_amount;
		this.purchaseOrder.discount_remain = this.purchaseOrder.total - this.purchaseOrder.discount_value;
		this.dataSourcePOItem.data = this.purchaseOrder.selected_cost_items;

		this.setProcessing( true );
		this.purchaseOrderApproverService
		.getAll( this.purchaseOrder.id )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			if ( !result ) return;
			_.each( result, ( item: any ) => {
				if ( this.account.role_key === item.role_key ) this.purchaseOrder.current_approver = item.id;

				switch ( item.role_key ) {
					case 'PROCUREMENT_MANAGER':
						this.approvers.procurement_manager.status = item.status;
						this.approvers.procurement_manager.comment = item.comment;
						this.approvers.procurement_manager.status_name = this.statusList[ this.approvers.procurement_manager.status ];

						if ( !item.user_id && this.isProcurementManager || this.account.id === item.user_id ) {
							this.approvers.procurement_manager.can_approve = true;
						}
						break;

					case 'PM':
						this.approvers.project_manager.status = item.status;
						this.approvers.project_manager.comment = item.comment;
						this.approvers.project_manager.status_name = this.statusList[ this.approvers.project_manager.status ];

						if ( !item.user_id && this.isPM || this.account.id === item.user_id ) {
							this.approvers.project_manager.can_approve = true;
						}
						break;

					case 'CEO':
						this.approvers.ceo.status = item.status;
						this.approvers.ceo.comment = item.comment;
						this.approvers.ceo.status_name = this.statusList[ this.approvers.ceo.status ];

						if ( !item.user_id && this.isCEO || this.account.id === item.user_id ) {
							this.approvers.ceo.can_approve = true;
						}
						break;
				}
			} );
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
	* Update approve status per each user
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		const updateData: any = { user_id: this.account.id };

		if ( this.isProcurementManager ) {
			updateData.status = this.approvers.procurement_manager.status;
			updateData.comment = this.approvers.procurement_manager.comment;
		}

		if ( this.isPM ) {
			updateData.status = this.approvers.project_manager.status;
			updateData.comment = this.approvers.project_manager.comment;
		}

		if ( this.isCEO ) {
			updateData.status = this.approvers.ceo.status;
			updateData.comment = this.approvers.ceo.comment;
		}

		this.purchaseOrderApproverService
		.update( this.purchaseOrder.current_approver, updateData )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result.message === 'PO_HAS_COST_MODIFICATION_ITEMS' ) {
					this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PO_HAS_INVALID_COST', this.purchaseOrder );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.PROCESS_APPROVAL_FAIL', this.purchaseOrder );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.PROCESS_APPROVAL_SUCCESS', this.purchaseOrder );

			this.dialogRef.close( true );
		} );
	}

}
