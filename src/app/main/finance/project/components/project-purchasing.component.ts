import {
	OnInit, OnDestroy, Component,
	Injector, Input, ViewChild,
	Output, EventEmitter, ViewEncapsulation
} from '@angular/core';
import {
	animate, state, style,
	transition, trigger
} from '@angular/animations';

import { MatDialog, MatPaginator, MatTableDataSource } from '@angular/material';
import { SnackBarService, UtilitiesService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import _ from 'underscore';

import { DialogConfirmComponent, NumberService } from '@core';
import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { ProjectCostItemService } from '@finance/project/services/project-cost-item.service';
import { ProjectPurchaseOrderService } from '@finance/project/services/project-purchase-order.service';
import { DialogProjectCostItemComponent } from './dialog-project-cost-item.component';
import { DialogProjectPurchaseOrderComponent } from './dialog-project-purchase-order.component';
import { DialogProjectPurchaseOrderModifyComponent } from './dialog-project-purchase-order-modify.component';
import { DialogPurchaseOrderApproverComponent } from './dialog-purchase-order-approver.component';
import { DialogRequestPaymentComponent } from './dialog-request-payment.component';
import {
	COST_MODIFICATION_STATUS, PURCHASE_ORDER_STATUS,
	PURCHASE_ORDER_APPROVE_STATUS, COLORS, MODIFIED_STATUS, PROJECT_STATUS
} from '@resources';
import {DialogProjectPurchasingItemComponent} from "@finance/project/components/dialog-project-purchasing-item.component";
import {MatSort} from "@angular/material/sort";
import {TableUtil} from "@app/utils/tableUtils";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
	selector	: 'project-purchasing',
	templateUrl	: '../templates/project-purchasing.pug',
	styleUrls	: [ '../styles/project-purchasing.scss' ],
	animations: [
		trigger(
			'detailExpand',
			[
				state( 'collapsed', style( { height: 0, minHeight: 0, visibility: 'hidden' } ) ),
				state( 'expanded', style( { height: '*', visibility: 'visible' } ) ),
				transition( 'expanded <=> collapsed', animate( '225ms cubic-bezier( .4, .0, .2, 1 )' ) ),
			]
		),
	],
	encapsulation: ViewEncapsulation.None,
})
export class ProjectPurchasingComponent extends ProjectBaseComponent implements OnInit, OnDestroy {
	@ViewChild('tableSourcePOSort') tableSourcePOSort: MatSort;

	@ViewChild( 'paginatorPurchasing' ) set paginatorPurchasing( paginator: MatPaginator ) {
		this.dataSourcePurchasing.paginator = paginator;
	}
	@ViewChild( 'paginatorPending' ) set paginatorPending( paginator: MatPaginator ) {
		this.dataSourcePending.paginator = paginator;
	}
	@ViewChild( 'paginatorPO' ) set paginatorPO( paginator: MatPaginator ) {
		this.dataSourcePO.paginator = paginator;
	}

	@Input() public project: any;
	@Input() public projectId: number;
	@Input() public canRequest: boolean;
	@Input() public loaded: boolean;

	@Output() public refreshProjectDetail: EventEmitter<any> = new EventEmitter<any>();

	public dataSourcePurchasing: MatTableDataSource<any> = new MatTableDataSource<any>( [] );
	public dataSourcePending: MatTableDataSource<any> = new MatTableDataSource<any>( [] );
	public dataSourcePO: MatTableDataSource<any> = new MatTableDataSource<any>( [] );
	public costItems: Array<any> = [];
	public selected: boolean;
	public sortDown: boolean = true;
	public selectedCostItems: Array<any> = [];
	public footerRow: any = { total: 0, total_pending: 0, total_po: 0, total_po_vat: 0 };
	public selectedTabIndex: number = 0;
	public searchString: string = '';
	public detailRowScrollable: any = {};
	public COST_MODIFICATION_STATUS: any = COST_MODIFICATION_STATUS;
	public PURCHASE_ORDER_STATUS: any = PURCHASE_ORDER_STATUS;
	public MODIFIED_STATUS: any = MODIFIED_STATUS;
	public projectStatus: any = PROJECT_STATUS;
	public displayedColumns: Array<string> = [
		'no', 'name', 'vendor',
		'unit', 'amount', 'price',
		'total', 'note',
		'status', 'actions',
	];
	public poListsColumns: Array<string> = [
		'pocode', 'po', 'vendor', 'name',
		'total', 'vat', 'total_vat', 'total_w_vat',
		'status', 'actions',
	];
	public pendingListsColumns: Array<string> = [
		'no', 'po', 'name', 'vendor',
		'unit', 'amount', 'price',
		'total', 'note',
		'status', 'actions',
	];
	public purchaseOrderStatus: Array<any> = [
		{
			id		: 0,
			key		: 'PROCESSING',
			name	: 'FINANCE.PROJECT.LABELS.PROCESSING',
			color	: COLORS.ACCENT,
			priority: 4,
		},
		{
			id		: 1,
			key		: 'WAITING_APPROVAL',
			name	: 'FINANCE.PROJECT.LABELS.WAITING_APPROVAL',
			color	: COLORS.WARNING,
			priority: 1,
		},
		{
			id		: 2,
			key		: 'APPROVED',
			name	: 'FINANCE.PROJECT.LABELS.APPROVED',
			color	: COLORS.SUCCESS,
			priority: 0,
		},
		{
			id		: 3,
			key		: 'CANCELLED',
			name	: 'FINANCE.PROJECT.LABELS.CANCELLED',
			color	: COLORS.WARN,
			priority: 3,
		},
		{
			id		: 4,
			key		: 'REJECTED',
			name	: 'FINANCE.PROJECT.LABELS.REJECTED',
			color	: COLORS.WARN,
			priority: 2,
		},
		{
			id		: 5,
			key		: 'MODIFIED',
			name	: 'FINANCE.PROJECT.LABELS.MODIFIED',
			color	: COLORS.WARN,
			priority: 1,
		},
		{
			id		: 6,
			key		: 'FREEZED',
			name	: 'FINANCE.PROJECT.LABELS.FREEZED',
			color	: COLORS.WARN,
			priority: 1,
		},
	];
	public approverStatus: Array<any> = [
		{
			id		: 0,
			key		: 'WAITING_APPROVAL',
			name	: 'FINANCE.PROJECT.LABELS.WAITING_APPROVAL',
			color	: COLORS.WARNING,
			priority: 2,
		},
		{
			id		: 1,
			key		: 'APPROVED',
			name	: 'FINANCE.PROJECT.LABELS.APPROVED',
			color	: COLORS.SUCCESS,
			priority: 0,
		},
		{
			id		: 2,
			key		: 'REJECTED',
			name	: 'FINANCE.PROJECT.LABELS.REJECTED',
			color	: COLORS.WARN,
			priority: 1,
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
	public poFilters: any = {};
	public poSearchQueries: any = {};
	public filteredPO: Array<any> = [];
	public filteredVendor: Array<any> = [];

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {SnackBarService} snackBarService
	* @param {UtilitiesService} utilitiesService
	* @param {TranslateService} translateService
	* @param {Router} router
	* @param {ActivatedRoute} route
	* @param {ProjectCostItemService} projectCostItemService
	* @param {ProjectPurchaseOrderService} projectPurchaseOrderService
	*/
	constructor(
		public injector						: Injector,
		public dialog						: MatDialog,
		public snackBarService				: SnackBarService,
		public utilitiesService				: UtilitiesService,
		public excelService     			: ExcelService,
		public translateService				: TranslateService,
		public router						: Router,
		public route						: ActivatedRoute,
		public projectCostItemService		: ProjectCostItemService,
		public projectPurchaseOrderService	: ProjectPurchaseOrderService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		if ( isNaN( this.projectId ) ) {
			this.backToList();
			return;
		}

		this.dataSourcePO.sortingDataAccessor = (data: any, sortHeaderId: string) => {
			const value: any = data[sortHeaderId];
			return typeof value === "string" ? value.toLowerCase() : value;
		};

		if ( this.isConstruction || this.isConstructionManager ) {
			this.displayedColumns.splice( 5, 2 );
			this.poListsColumns.splice( 4, 4 );
			this.pendingListsColumns.splice( 6, 2 );
		}

		this.initData();
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		super.ngOnDestroy();
	}

	/**
	* Init all data
	* @return {void}
	*/
	public initData() {
		if ( !this.isPurchasing ) {
			this.tabChanged( 2 );
			this.selectedTabIndex = 2;
		}
		this.tabChanged( 0 );
	}

	/**
	* Back to projects list
	* @return {void}
	*/
	public backToList() {
		this.router.navigate( [ 'finance/project' ] );
	}

	/**
	* Tab changed
	* @param {number} tabIndex
	* @return {void}
	*/
	public tabChanged( tabIndex: number ) {
		if ( tabIndex === 0 ) {
			( !this.dataSourcePurchasing.data || !this.dataSourcePurchasing.data.length )
				&& this.getList();
			return;
		}
		if ( tabIndex === 1 ) {
			( !this.dataSourcePending.data || !this.dataSourcePending.data.length )
				&& this.getPendingList();
			return;
		}
		if ( tabIndex === 2 ) {
			( !this.dataSourcePO.data || !this.dataSourcePO.data.length )
				&& this.getPOList();
			return;
		}
	}

	/**
	* Open dialog request payment
	* @param {any} po - Project purchase order
	* @return {void}
	*/
	public openDialogRequestPayment( po: any ) {
		if ( !this.canRequest ) {
			this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PROJECT_STATUS_INVALID' );
			return;
		}

		const poRemaining: number = po.total > po.planed ? po.total - po.planed : 0;
		const poVATRemaining: number = po.total_vat > po.vat_planed ? po.total_vat - po.vat_planed : 0;

		const dialogRef: any = this.dialog.open(
			DialogRequestPaymentComponent,
			{
				width: '800px',
				data: {
					project_id					: this.projectId,
					project_purchase_order_id	: po.id,
					po_vat_percent				: po.vat_percent || 0,
					po_name						: po.name,
					remaining					: poRemaining,
					vat_remaining				: poVATRemaining,
					total						: po.total || 0,
					valid_duration				: po.project.valid_duration
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getPOList();
		} );
	}

	/**
	 * Open dialog project cost item to create/update
	 * @param {any} data - Project line item data need create/update
	 * @return {void}
	 */
	public showGroupModalDetail( data: any = {} ) {
		const dialogComponent: any = DialogProjectPurchasingItemComponent;
		const dialogRef: any = this.dialog.open(
			dialogComponent,
			{
				width	: '850px',
				data	: {
					element: data,
					costItems: this.costItems
				},
			}
		);

		dialogRef
			.afterClosed()
			.subscribe( ( result: any ) => {
				if ( !result ) return;
			} );
	}


	/**
	* Get pending list
	* @return {void}
	*/
	public getPendingList() {
		this.setProcessing( true );
		this.loaded = false;
		this.projectCostItemService
		.getAll( this.projectId, 'pending_items' )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;

			result = _.map( result, ( item: any ) => {
				item.po_id = item.project_purchase_order.id;
				item.total = item.price * item.amount;
				item.status = item.project_cost_modifications.length
					? _.last( item.project_cost_modifications ).status
					: COST_MODIFICATION_STATUS.VALID;
				item.status_name = _.findWhere( this.projectCostModificationStatus, { id: item.status } );

				if ( item.bk_price !== null ) {
					item.bk_total = item.bk_amount * item.bk_price;
				}

				this.footerRow.total_pending += item.total;

				return item;
			} );
			result = _.sortBy( result, 'po_id' );
			this.dataSourcePending.data = this.costItems = result;
		} );
	}

	/**
	* Open Dialog
	* @param {any} data
	* @return {void}
	*/
	public openApproverDialog( data?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogPurchaseOrderApproverComponent,
			{
				width		: '950px',
				panelClass	: [ 'dialog-purchase-order-approver', 'mat-dialog' ],
				data: {
					name					: data.name,
					total					: data.total,
					id						: data.id,
					project_purchase_order	: data,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getPOList();
			this.getPendingList();

			this.refreshProjectDetail.emit();
		} );
	}

	/**
	* Show PO detail
	* @param {any} po
	* @return {void}
	*/
	public showGroupDetail( po: any ) {
		po.show_detail_row = !po.show_detail_row;

		this.detailRowScrollable[ 'PO_' + po.id ] = true;

		setTimeout( () => this.detailRowScrollable[ 'PO_' + po.id ] = false, 255 );
	}

	/**
	* Show children cost items
	* @param {any} parentCost
	* @return {void}
	*/
	public showChildrenCostsDetail( parentCost: any ) {
		parentCost.show_detail_row = !parentCost.show_detail_row;

		this.detailRowScrollable[ 'COST_' + parentCost.id ] = true;

		setTimeout( () => this.detailRowScrollable[ 'COST_' + parentCost.id ] = false, 255 );
	}

	/**
	* Get project bills
	* @return {void}
	*/
	public getPOList() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectPurchaseOrderService
		.getAll( this.projectId )
		.subscribe( ( result: any ) => {
			const dataSourceWithExpanded: Array<any> = [];
			this.setProcessing( false );
			this.loaded = true;

			this.footerRow.total_po = 0;
			this.footerRow.total_po_vat = 0;
			this.poFilters = {};
			this.poSearchQueries = {};

			const _filteredPO: Array<any> = [];
			const _filteredVendor: Array<any> = [];
			const statusIds: Array<number> = [];

			_.map( result, ( item: any ) => {
				item.total = 0;
				item.new_total = 0;
				item.total_vat = 0;

				item.po_code = item.id
					? 'PO' + NumberService.padNumberFormatter( item.id, 4 )
					: null;

				_filteredPO.push({ id: item.po_code, name: item.po_code });

				if ( item.vendor && item.vendor.short_name && !_filteredVendor[ item.vendor.short_name ] ) {
					_filteredVendor[ item.vendor.short_name ] = { id: item.vendor.id, name: item.vendor.short_name };
				}

				if ( item.status === PURCHASE_ORDER_STATUS.MODIFIED ) {
					const oldItemsObj: any = {};

					_.each( JSON.parse( item.old_data ), ( costItem: any ) => {
						costItem.total = costItem.amount * costItem.price;
						item.total += costItem.total;

						( !item.old_count_cost ) && ( item.old_count_cost = 0 );
						( costItem.modified_status !== MODIFIED_STATUS.REMOVED ) && ( item.old_count_cost++ );

						oldItemsObj[ costItem.id ] = costItem;
					});

					item.selected_cost_items = _.sortBy( _.map( JSON.parse( item.new_data ), ( costItem: any ) => {
						costItem.total = costItem.amount * costItem.price;
						costItem.status = costItem.project_cost_modifications
							&& costItem.project_cost_modifications.length
							? _.last( costItem.project_cost_modifications ).status
							: COST_MODIFICATION_STATUS.VALID;
						costItem.status_name = this.projectCostModificationStatus[ costItem.status ];

						( !item.new_count_cost ) && ( item.new_count_cost = 0 );

						if ( costItem.modified_status !== MODIFIED_STATUS.REMOVED ) {
							item.new_count_cost++;
							item.new_total += costItem.total;
						}

						if ( costItem.modified_status === MODIFIED_STATUS.EDITED ) {
							if ( oldItemsObj[ costItem.id ] ) {
								costItem.old_price = oldItemsObj[ costItem.id ].price;
								costItem.old_amount = oldItemsObj[ costItem.id ].amount;
								costItem.old_total = oldItemsObj[ costItem.id ].amount * oldItemsObj[ costItem.id ].price;
							}
						}
						costItem.modified_status_name = this.modifiedStatus[ costItem.modified_status || 0 ];
						costItem.ordering = this.modifiedStatus[ costItem.modified_status || 0 ].priority;

						return costItem;
					}), 'ordering' );
					item.new_discount_value = ( item.discount_type === '%' )
						? ( item.new_total * item.discount_amount / 100 )
						: item.discount_amount;
					item.new_total -= item.new_discount_value;

					item.discount_amount = item.discount_amount_bk;
					item.discount_type = item.discount_type_bk;
				} else {
					item.selected_cost_items = _.map( item.project_cost_items, ( costItem: any ) => {
						costItem.total = costItem.amount * costItem.price;
						costItem.status = costItem.project_cost_modifications
							&& costItem.project_cost_modifications.length
							? _.last( costItem.project_cost_modifications ).status
							: COST_MODIFICATION_STATUS.VALID;
						costItem.status_name = this.projectCostModificationStatus[ costItem.status ];
						item.total += costItem.total;

						( !item.old_count_cost ) && ( item.old_count_cost = 0 );
						( costItem.modified_status !== MODIFIED_STATUS.REMOVED ) && ( item.old_count_cost++ );

						return costItem;
					});
				}

				item.discount_value = ( item.discount_type === '%' )
					? ( item.total * item.discount_amount / 100 )
					: item.discount_amount;

				item.total -= item.discount_value;
				item.total_vat = item.total * item.vat_percent / 100;
				item.subtotal = item.total + item.total_vat;

				item.status_name = this.purchaseOrderStatus[ item.status ];
				item.planed = 0;
				item.vat_planed = 0;
				_.each( item.project_payments, ( payment: any ) => {
					item.planed += payment.total_real || payment.total || 0;
					item.vat_planed += isNaN( payment.total_vat_real )
						? ( payment.total_vat || 0 )
						: +payment.total_vat_real;
				});

				item.approvers_process = {
					count	: 0,
					is_done	: false,
					waiting: {
						...this.approverStatus[ PURCHASE_ORDER_APPROVE_STATUS.WAITING_APPROVAL ],
						count: 0,
					},
					approved: {
						...this.approverStatus[ PURCHASE_ORDER_APPROVE_STATUS.APPROVED ],
						count: 0,
					},
					rejected: {
						...this.approverStatus[ PURCHASE_ORDER_APPROVE_STATUS.REJECTED ],
						count: 0,
					},
				};
				_.each( item.project_po_approvers, ( poApprover: any ) => {
					if ( poApprover.role_key === 'CEO' ) {
						item.approvers_process.need_ceo = true;
					}

					item.approvers_process.count++;
					if ( poApprover.status === PURCHASE_ORDER_APPROVE_STATUS.WAITING_APPROVAL ) {
						item.approvers_process.waiting.count++;
					}
					if ( poApprover.status === PURCHASE_ORDER_APPROVE_STATUS.APPROVED ) {
						item.approvers_process.approved.count++;
					}
					if ( poApprover.status === PURCHASE_ORDER_APPROVE_STATUS.REJECTED ) {
						item.approvers_process.rejected.count++;
					}
				} );

				if ( item.approvers_process.waiting.count === item.approvers_process.count
				|| item.approvers_process.approved.count === item.approvers_process.count
				|| item.approvers_process.rejected.count === item.approvers_process.count ) {
					item.approvers_process.is_done = true;
				}

				item.status_name && item.status_name.id >= 0 && statusIds.push( item.status_name.id );

				this.arrangeStatusByRole( item );
				this.footerRow.total_po += item.total;
				this.footerRow.total_po_vat += item.total_vat;

				dataSourceWithExpanded.push({
					...item,
					show_detail_row	: false,
					main_row		: true,
				});
			} );

			this.filteredPO = _filteredPO;
			this.filteredVendor = _.values( _filteredVendor );

			this.dataSourcePO.data = this.customSortDataSource( dataSourceWithExpanded );
			this.dataSourcePO.sort = this.tableSourcePOSort;
			this.poFilters[ 'status_name.id' ] = _.uniq( statusIds );
		} );
	}

	/**
	* Arrange po by vat rate
	* @return {array}
	*/
	public sortPOVat() {
		const newDataSource: Array<any> = [];
		const parentDataSource: Array<any> = _.filter( this.dataSourcePO.data, { main_row: true } );

		parentDataSource.sort( ( a: any, b: any ) => a.vat_percent - b.vat_percent
			|| a.total_vat - b.total_vat );

		this.sortDown && parentDataSource.reverse();
		this.sortDown = !this.sortDown;

		_.each( parentDataSource, ( item: any ) => {
			newDataSource.push(
				item,
				{
					po_info		: item,
					id			: item.id,
					detail_row	: true,
					cost_items	: item.selected_cost_items,
				}
			);
		});

		this.dataSourcePO.data = newDataSource;
	}

	/**
	* Arrange status by role
	* @param {any} po
	* @return {array}
	*/
	public arrangeStatusByRole( po: any ) {
		const decision: any = _.findWhere( po.project_po_approvers, { role_key: this.account.role_key } );

		switch ( po.status_name.key ) {
			case 'PROCESSING':
			case 'CANCELLED':
				if ( this.isProcurementManager || this.isPM || this.isCEO ) {
					po.status_name.priority = 0;
				}
				break;
			case 'WAITING_APPROVAL':
				if ( this.isProcurementManager || this.isPM || this.isCEO ) {
					po.status_name.priority = 4;

					if ( decision
						&& decision.status !== PURCHASE_ORDER_APPROVE_STATUS.WAITING_APPROVAL ) {
						po.status_name.priority = 2;
					}
				}
				break;
			case 'REJECTED':
				if ( this.isProcurementManager || this.isPM || this.isCEO ) {
					po.status_name.priority = 3;
				}
				break;
			case 'APPROVED':
				if ( this.isProcurementManager || this.isPM || this.isCEO ) {
					po.status_name.priority = 1;
				}
				break;
		}
	}

	/**
	* Custom sort data source
	* @param {any} dataSourceClone
	* @return {array}
	*/
	public customSortDataSource( dataSourceClone: any ) {
		const data: Array<any> = _.clone( dataSourceClone );

		data.sort( ( a: any, b: any ) => b.status_name.priority - a.status_name.priority
			|| b.approvers_process.waiting.count - a.approvers_process.waiting.count );

		const tempData: Array<any> = [];

		_.map( data , ( item: any ) => {
			tempData.push(
				item,
				{
					po_info		: item,
					id			: item.id,
					detail_row	: true,
					cost_items	: item.selected_cost_items,
				}
			);
		} );

		return tempData;
	}

	/**
	* Cancel PO
	* @param {any} PO
	* @param {number} statusPO
	* @return {void}
	*/
	public changeStatusPO( PO: any, statusPO: number ) {
		let dialogRef: any;

		if ( statusPO === PURCHASE_ORDER_STATUS.CANCELLED ) {
			dialogRef = this.dialog.open(
				DialogConfirmComponent,
				{
					width: '400px',
					data: {
						title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.CANCEL_PO' ),
						content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.CANCEL_PO_CONFIRMATION', PO ),
						actions: {
							yes: { color: 'warn' },
						},
					},
				}
			);
		} else {
			dialogRef = this.dialog.open(
				DialogConfirmComponent,
				{
					width: '400px',
					data: {
						title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.SUBMIT_PO' ),
						content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.SUBMIT_PO_CONFIRMATION', PO ),
						actions: {
							yes: { color: 'accent' },
						},
					},
				}
			);
		}

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			this.projectPurchaseOrderService
			.changeStatus( PO.id, statusPO )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					if ( result.message === 'PO_HAS_COST_MODIFICATION_ITEMS' ) {
						this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PO_HAS_INVALID_COST', PO );
						return;
					}
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.CHANGE_PO_STATUS_FAIL', PO );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.CHANGE_PO_STATUS_SUCCESS', PO );

				this.getPOList();
			} );
		} );
	}

	/**
	* Freeze PO
	* @param {any} PO
	* @param {number} statusPO
	* @return {void}
	*/
	public freezePO( PO: any, statusPO: number ) {
		let dialogRef: any;

		if ( statusPO === PURCHASE_ORDER_STATUS.FREEZED ) {
			dialogRef = this.dialog.open(
				DialogConfirmComponent,
				{
					width: '400px',
					data: {
						title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.FREEZE_PO' ),
						content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.FREEZE_PO_CONFIRMATION', PO ),
						actions: {
							yes: { color: 'warning' },
						},
					},
				}
			);
		} else {
			dialogRef = this.dialog.open(
				DialogConfirmComponent,
				{
					width: '400px',
					data: {
						title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DEFROST_PO' ),
						content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DEFROST_PO_CONFIRMATION', PO ),
						actions: {
							yes: { color: 'success' },
						},
					},
				}
			);
		}

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			this.projectPurchaseOrderService
			.freezePO( PO.id, statusPO )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.CHANGE_PO_STATUS_FAIL', PO );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.CHANGE_PO_STATUS_SUCCESS', PO );

				this.getPOList();
			} );
		} );
	}

	/**
	* Delete purchaseOrder
	* @param {any} purchaseOrder
	* @return {void}
	*/
	public deletePO( purchaseOrder: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DELETE_PO' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DELETE_PO_CONFIRMATION', purchaseOrder ),
					actions: {
						yes: { color: 'warn' },
					},
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			this.projectPurchaseOrderService
			.delete( purchaseOrder.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PO_FAIL', purchaseOrder );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PO_SUCCESS', purchaseOrder );

				this.getPOList();
				this.getList();
			} );
		} );
	}

	/**
	* Get project bills
	* @param {any} oldData
	* @return {void}
	*/
	public getList( oldData?: any ) {
		this.setProcessing( true );
		this.loaded = false;
		this.projectCostItemService
		.getAll( this.projectId, 'quotation_approved' )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;

			this.searchString = ( oldData && oldData.search_string ) ? oldData.search_string : null;

			const parentObj: any = {};
			const notParent: Array<any> = _.filter( result, ( item: any ) => {
				if ( item.is_parent ) {
					parentObj[ item.id ] = { ...item, total_children: 0 };
				}

				return !item.is_parent;
			});

			let totalPurchasing: number = 0;

			_.each( notParent, ( item: any ) => {
				item.total = item.amount * item.price;
				item.status = item.project_cost_modifications.length
					? _.last( item.project_cost_modifications ).status
					: COST_MODIFICATION_STATUS.VALID;

				if ( item.status !== COST_MODIFICATION_STATUS.REJECTED
					|| ( item.bk_price && item.status === COST_MODIFICATION_STATUS.REJECTED )
				) {
					!item.project_purchase_order_id && ( totalPurchasing += item.total );

					if ( item.status === COST_MODIFICATION_STATUS.WAITING ) {
						const lastModification: any = _.last( item.project_cost_modifications );
						item.price = lastModification.new_price;
						item.amount = lastModification.new_amount;
						item.total = item.amount * item.price;
					}
				}

				if ( item.parent_id && parentObj[ item.parent_id ] ) {
					( !parentObj[ item.parent_id ].count_child )
					&& ( parentObj[ item.parent_id ].count_child = 0 );

					parentObj[ item.parent_id ].total_children += item.total;
					parentObj[ item.parent_id ].count_child++;
				}
			});

			result = _.filter(
				_.map( result, ( _item: any ) => {
					if ( parentObj[ _item.id ] ) {
						_item.total_children = parentObj[ _item.id ].total_children;
						_item.count_child = parentObj[ _item.id ].count_child;
					}

					return _item;
				}),
				( item: any ) => !item.project_purchase_order_id
			);

			this.costItems = result;
			this.selected = false;
			this.selectedCostItems = [];

			if ( this.searchString && this.searchString.length ) {
				this.applyFilterPurchasing();
			} else {
				this.dataSourcePurchasing.data = this._renderExtendedDatasource( this.costItems );
			}
			this.footerRow.total = totalPurchasing;
		} );
	}

	/**
	* _renderExtendedDatasource
	* @param {Array} costItems
	* @return {Array}
	*/
	public _renderExtendedDatasource( costItems: Array<any> ): Array<any> {
		const parentObj: any = {};
		const children: Array<any> = [];
		const dataSourceWithExpanded: Array<any> = [];

		// get parent and children
		_.each( costItems, ( item: any ) => {
			item.status = item.project_cost_modifications.length
				? _.last( item.project_cost_modifications ).status
				: COST_MODIFICATION_STATUS.VALID;
			item.status_name = _.findWhere( this.projectCostModificationStatus, { id: item.status } );

			if ( item.status === COST_MODIFICATION_STATUS.WAITING ) {
				const lastModification: any = _.last( item.project_cost_modifications );
				item.bk_price = item.bk_amount = item.bk_total = null;
				item.price = lastModification.new_price;
				item.amount = lastModification.new_amount;
			}

			if ( item.bk_price !== null ) item.bk_total = item.bk_amount * item.bk_price;

			if ( _.find( this.selectedCostItems, { id: item.id } ) ) item.checked = true;
			else item.checked = false;

			item.total = item.amount * item.price;

			if ( item.parent_id ) {
				children.push( item );
				return;
			}

			parentObj[ item.id ] = {
				...item,
				children: [],
			};
		});

		// map children to parent
		_.each( children, ( item: any ) => {
			if ( parentObj[ item.parent_id ] ) {
				parentObj[ item.parent_id ].children.push( item );
				parentObj[ item.parent_id ].is_parent = true;
			}
		});

		// render parent array
		const parent: Array<any> = _.values( parentObj );

		// build expanded data source
		_.each( parent, ( item: any ) => {
			const parentItem: any = {
				...item,
				show_detail_row	: !!item.children.length,
				main_row		: true,
			};

			const childItem: any = {
				parent_info	: parentItem,
				detail_row	: true,
				id			: item.id,
				children	: item.children,
			};

			dataSourceWithExpanded.push( parentItem, childItem );
		});
		return dataSourceWithExpanded;
	}

	/**
	* Check dataSource table had checked or not
	* @return {number}
	*/
	public isChecked(): number {
		const costItems: Array<any> = this.dataSourcePurchasing.data;
		this.selectedCostItems = [];
		_.each( costItems, ( item: any ) => {
			if ( item.checked ) this.selectedCostItems.push( item );

			if ( item.detail_row ) {
				_.each( item.children, ( _item: any ) => {
					if ( _item.checked ) this.selectedCostItems.push( _item );
				});
			}
		});
		return this.selectedCostItems.length;
	}

	/**
	* Check all datasource if had same vendor
	* @return {number}
	*/
	public checkAll() {
		if ( this.footerRow.selecting_all ) {
			this.footerRow.selecting_all = false;
			this.getList();
			return;
		}

		this.footerRow.selecting_all = true;

		const vendorId: number = this.selectedCostItems[ 0 ].vendor_id;
		const costItems: Array<any> = _.map( this.dataSourcePurchasing.data, ( parent: any ) => {
			if ( !parent.is_parent && parent.vendor_id === vendorId && parent.status !== COST_MODIFICATION_STATUS.WAITING ) {
				parent.checked = true;
			}

			if ( parent.detail_row ) {
				parent.children = _.map( parent.children, ( child: any ) => {
					if ( child.vendor_id === vendorId && child.status !== COST_MODIFICATION_STATUS.WAITING ) {
						child.checked = true;
					}
					return child;
				});
			}

			return parent;
		});
		this.dataSourcePurchasing.data = costItems;
	}

	/**
	* Update list items selected according to vendor_id
	* @param {any} costItem
	* @return {void}
	*/
	public updateSelectedList( costItem: any ) {
		// if uncheck all item, set list back to backup items, total
		if ( !this.isChecked() ) {
			this.selected = false;
			this.selectedCostItems = [];
			this.dataSourcePurchasing.data = this._renderExtendedDatasource( this.costItems );
			return;
		}

		if ( !this.selected ) {
			this.selected = true;
			const reducedCostItems: Array<any> = _.filter( this.costItems, { vendor_id: costItem.vendor_id } );
			const reducedCostItemsObj: any = {};

			_.each( reducedCostItems, ( item: any ) => {
				reducedCostItemsObj[ item.id ] = item;

				if ( item.parent_id && !reducedCostItemsObj[ item.parent_id ] ) {
					reducedCostItemsObj[ item.parent_id ] = _.findWhere( this.costItems, { id: item.parent_id } );
				}
			});
			this.dataSourcePurchasing.data = this._renderExtendedDatasource( _.values( reducedCostItemsObj ) );
		}
	}

	/**
	* Apply filter purchasing
	* @return {void}
	*/
	public applyFilterPurchasing() {
		if ( !this.searchString || !this.searchString.length ) {
			this.selected = false;
			this.selectedCostItems = [];
			this.dataSourcePurchasing.data = this._renderExtendedDatasource( this.costItems );
			return;
		}

		const matchedCostItems: Array<any> = _.filter( this.costItems, ( item: any ) => {
			return UtilitiesService.stripVietnameseSymbol(
				item.name
				.toLowerCase()
				.replace( / /g, '' )
			)
			.indexOf(
				UtilitiesService.stripVietnameseSymbol(
					this.searchString
					.toLowerCase()
					.replace( / /g, '' )
				)
			) >= 0;
		});
		const matchedCostItemsObj: any = {};

		_.each( matchedCostItems, ( item: any ) => {
			matchedCostItemsObj[ item.id ] = item;

			if ( item.parent_id && !matchedCostItemsObj[ item.parent_id ] ) {
				matchedCostItemsObj[ item.parent_id ] = _.findWhere( this.costItems, { id: item.parent_id } );
			}
		});
		this.dataSourcePurchasing.data = this._renderExtendedDatasource( _.values( matchedCostItemsObj ) );
	}

	/**
	* Open Dialog to make purchase order according to cost items checked
	* @param {any} data
	* @return {void}
	*/
	public openDialogProjectPurchaseOrder( data?: any ) {
		let totalSelected: number = 0;
		_.each( this.selectedCostItems, ( item: any ) => {
			totalSelected += item.total;
		});
		const dialogRef: any = this.dialog.open(
			DialogProjectPurchaseOrderComponent,
			{
				width: '950px',
				data: {
					...data,
					project_id			: this.projectId,
					project_name		: this.project.name,
					selected_cost_items	: data ? data.selected_cost_items : this.selectedCostItems,
					selected_total		: data ? data.total : totalSelected,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getPOList();
			this.getList();
		} );
	}

	/**
	* Open Dialog to make purchase order according to cost items checked
	* @param {any} data
	* @return {void}
	*/
	public openDialogProjectPurchaseOrderModify( data: any ) {
		const dialogRef: any = this.dialog.open(
			DialogProjectPurchaseOrderModifyComponent,
			{
				width: '950px',
				data: {
					...data,
					project_id			: this.projectId,
					project_name		: this.project.name,
					selected_cost_items	: _.map( data.selected_cost_items, ( item : any ) => ({ ...item })),
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getPOList();
			this.getList();
		} );
	}

	/**
	* Open dialog project cost item to create/update
	* @param {any} data
	* @param {string} view
	* @param {boolean} isModifyingVendor
	* @return {void}
	*/
	public openDialogProjectCostItem( data: any = {}, view: string = '' ) {
		const vendor: any = data.vendor;
		const dialogComponent: any = DialogProjectCostItemComponent;
		const dialogData: any = {
			project_id				: this.projectId,
			project_name			: this.project.name,
			project_quotation_status: this.project.quotation_status,
			project_line_item		: data.project_line_item,
			vendor_id				: vendor ? vendor.id : null,
			vendor_category_id		: vendor && vendor.vendor_category ? vendor.vendor_category.id : null,
			cost_item_category_id	: data.cost_item_category_id,
			id						: data.id,
			name					: data.name,
			unit					: data.unit,
			amount					: data.amount,
			price					: data.price,
			note					: data.note,
			description				: data.description,
			image					: data.image,
			is_modifying_cost		: data.id && data.amount && data.price && !( view === 'modify_vendor' ),
			is_modifying_vendor		: ( view === 'modify_vendor' ),
			parent_id				: data.parent_id,
		};

		const dialogRef: any = this.dialog.open(
			dialogComponent,
			{
				width	: '750px',
				data	: dialogData,
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			if ( view === 'modify_pending' ) {
				this.getPendingList();
				this.getPOList();
			} else {
				this.getList( { search_string: this.searchString } );
			}
		} );
	}

	/**
	* Open dialog create child project cost item
	* @param {any} data
	* @return {void}
	*/
	public openChildProjectCostItem( data: any = {} ) {
		const vendor: any = data.vendor;
		const dialogComponent: any = DialogProjectCostItemComponent;
		const dialogData: any = {
			project_id				: this.projectId,
			project_name			: this.project.name,
			project_quotation_status: this.project.quotation_status,
			project_line_item		: data.project_line_item,
			vendor_id				: vendor ? vendor.id : null,
			vendor_category_id		: vendor && vendor.vendor_category ? vendor.vendor_category.id : null,
			cost_item_category_id	: data.cost_item_category_id,
			name					: data.name,
			unit					: data.unit,
			amount					: data.amount,
			price					: data.price,
			note					: data.note,
			description				: data.description,
			image					: data.image,
			parent_id				: data.id,
		};

		const dialogRef: any = this.dialog.open(
			dialogComponent,
			{
				width	: '750px',
				data	: dialogData,
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getList( { search_string: this.searchString } );
		} );
	}

	/**
	* Delete project cost item
	* @param {any} costItem - project cost item id need to be deleted
	* @return {void}
	*/
	public deleteProjectCostItem( costItem: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DELETE_COST_ITEM' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DELETE_COST_ITEM_CONFIRMATION', costItem ),
					actions: {
						yes: { color: 'warn' },
					},
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			this.projectCostItemService
			.delete( costItem.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_COST_ITEM_FAIL', costItem );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_COST_ITEM_SUCCESS', costItem );

				this.getList( { search_string: this.searchString } );
			} );
		} );
	}

	/**
	* Apply filter purchasing order list
	* @return {void}
	*/
	public applyFilterPO() {
		let poTotal: number = 0;
		let poTotalVAT: number = 0;

		this.dataSourcePO.filterPredicate = ( data: any, filters: any ) => {
			let flag: boolean = true;

			_.each( filters, ( filter: any, key: string ) => {
				if ( !flag
					|| filter === null
					|| filter === undefined ) {
					return;
				}

				const value: any = _.get( data.main_row ? data : ( data.po_info || {} ), key );

				// Range filter
				if ( !isNaN( filter.min ) && !isNaN( filter.max ) ) {
					flag = value >= filter.min && value <= filter.max;
					return;
				}

				flag = value === filter || _.contains( filter, value );
			} );

			_.each( this.poSearchQueries, ( query: string, key: string ) => {
				if ( !flag ) return;

				flag = UtilitiesService.stripVietnameseSymbol(
					( _.get( data.main_row ? data : ( data.po_info || {} ), key ) || '' )
					.toString()
					.toLowerCase()
					.replace( / /g, '' )
				)
				.indexOf(
					UtilitiesService.stripVietnameseSymbol(
						( query || '' )
						.toLowerCase()
						.replace( / /g, '' )
					)
				) > -1;
			} );

			if ( flag && data.main_row ) {
				poTotal += data.total;
				poTotalVAT += data.total_vat;
			}

			return flag;
		};
		this.dataSourcePO.filter = this.poFilters;

		this.footerRow.total_po = poTotal;
		this.footerRow.total_po_vat = poTotalVAT;
	}

	public exportExcelPO() {
		const headerSetting = {
			header: [
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PO_CODE'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PO'),
				this.translateService.instant('FINANCE.VENDOR.ATTRIBUTES.VENDOR'),
				this.translateService.instant('FINANCE.COST_ITEM.ATTRIBUTES.COST_ITEM'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'),
				this.translateService.instant('GENERAL.ATTRIBUTES.VAT_RATE'),
				this.translateService.instant('GENERAL.ATTRIBUTES.VAT'),
				this.translateService.instant('FINANCE.PROJECT.LABELS.SUBTOTAL'),
				this.translateService.instant('FINANCE.COST_ITEM.ATTRIBUTES.STATUS')
			],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'purchasing order'}),
			fgColor: 'ffffff',
			bgColor: '00245A',
			widths: [20, 20, 50, 20, 30, 20, 30, 30, 30]
		};
		const title = 'Purchasing Orders List';
		const sheetName = 'Purchasing_Orders';
		const fileName = `${TableUtil.slug(this.project.name || '')}_Purchasing_Orders_List`;
		const exportData: any[] = [];
		this.dataSourcePO.data.forEach((item: any) => {
			if ((item.status_name && item.status_name.name)) {
				const dataItem: any[] = [];
				const status = (item.status_name && item.status_name.name)
					? {
						value: this.translateService.instant(item.status_name.name),
						fgColor: item.status_name.color
							? item.status_name.color.replace('#', '')
							: 'FFFFFF'
					}
					: {
						value: '',
						fgColor: 'FFFFFF'
					};
				dataItem.push(item.po_code || 'N/A');
				dataItem.push(item.name || 'N/A');
				dataItem.push((item.vendor && item.vendor.short_name) ? item.vendor.short_name : 'N/A');
				dataItem.push({
					value: TableUtil.pad(item.old_count_cost || 0, 2) + ' ' + this.translateService.instant('FINANCE.PROJECT.LABELS.ITEMS'),
					alignment: {
						horizontal: 'right',
						vertical: 'middle',
						wrapText: true
					}
				});
				const total: any = {
					richText: [
						{font: {size: 12},text: `${TableUtil.getNumberFormatForExcel(item.total || 0, 0)}\r\n`},
						{font: {size: 12},text: ''}
					]
				};
				if ((item.status !== PURCHASE_ORDER_STATUS.MODIFIED)) {
					total.richText[1].font.color = {argb: '2196F3'};
					total.richText[1].text = TableUtil.getNumberFormatForExcel(item.planed || 0, 0);
				} else {
					total.richText[1].font.color = {argb: '38AE00'};
					total.richText[1].text = TableUtil.getNumberFormatForExcel(item.new_total || 0, 0);
				}
				dataItem.push(total);
				dataItem.push({
					value: TableUtil.getNumberFormatForExcel(item.vat_percent || 0, 0) + '%',
					alignment: {
						horizontal: 'center',
						vertical: 'middle',
						wrapText: true
					}
				});
				const vat: any = {
					richText: [
						{font: {size: 12},text: `${TableUtil.getNumberFormatForExcel(item.total_vat || 0, 0)}\r\n`},
						{font: {size: 12},text: ''}
					]
				};
				if ((item.status !== PURCHASE_ORDER_STATUS.MODIFIED)) {
					vat.richText[1].font.color = {argb: '2196F3'};
					vat.richText[1].text = TableUtil.getNumberFormatForExcel((item.planed || 0) * ((item.vat_percent || 0) / 100));
				} else {
					vat.richText[1].font.color = {argb: '38AE00'};
					vat.richText[1].text = TableUtil.getNumberFormatForExcel((item.new_total || 0) * ((item.vat_percent || 0) / 100));
				}
				dataItem.push(vat);
				const subTotal: any = {
					richText: [
						{font: {size: 12},text: `${TableUtil.getNumberFormatForExcel((item.total_vat || 0) + (item.total || 0), 0)}`}
					]
				};
				if ((item.status === PURCHASE_ORDER_STATUS.MODIFIED)) {
					subTotal.richText.push({
						font: {size: 12, color: {argb: '38AE00'}},
						text: `\n\r${TableUtil.getNumberFormatForExcel((item.new_total || 0) * (1 + (item.vat_percent || 0) / 100))}`
					});
				}
				dataItem.push(subTotal);

				dataItem.push(status);
				exportData.push(dataItem);
			}
		});
		if (exportData.length < 1) {
			this.snackBarService.warn('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'purchasing order'});
			return;
		}
		const extraData = [
			{title: 'Total PO', value: TableUtil.getNumberFormatForExcel(this.footerRow.total_po || 0), fgColors: ['FD8631', '38AE00']},
			{title: 'Total VAT', value: TableUtil.getNumberFormatForExcel(this.footerRow.total_po_vat || 0), fgColors: ['FD8631', '38AE00']},
			{title: 'Total PO VAT', value: TableUtil.getNumberFormatForExcel((this.footerRow.total_po || 0) + (this.footerRow.total_po_vat || 0)), fgColors: ['FD8631', '38AE00']}
		];
		this.excelService.exportArrayToExcel(
			exportData,
			title,
			headerSetting,
			sheetName,
			fileName,
			extraData
		);
	}

	public exportExcelPurchasing() {
		const headerSetting = {
			header: [
				this.translateService.instant('GENERAL.ATTRIBUTES.NAME'),
				this.translateService.instant('FINANCE.VENDOR.ATTRIBUTES.VENDOR'),
				this.translateService.instant('GENERAL.ATTRIBUTES.UNIT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.AMOUNT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PRICE'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.NOTE'),
				this.translateService.instant('FINANCE.COST_ITEM.ATTRIBUTES.STATUS'),
			],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'purchasing'}),
			fgColor: 'ffffff',
			bgColor: '00245A',
			widths: [50, 20, 20, 30, 20, 30, 30, 50]
		};
		const title = 'Purchasings List';
		const sheetName = 'Purchasings';
		const fileName = `${TableUtil.slug(this.project.name || '')}_Purchasings_List`;
		const exportData: any[] = [];
		this.dataSourcePurchasing.data.forEach((item: any) => {
			if ((item.status_name && item.status_name.name)) {
				const dataItem: any[] = [];
				const status = (item.status_name && item.status_name.name && !item.is_parent)
					? {
						value: this.translateService.instant(item.status_name.name),
						fgColor: item.status_name.color
							? item.status_name.color.replace('#', '')
							: 'FFFFFF'
					}
					: {
						value: '',
						fgColor: 'FFFFFF'
					};
				dataItem.push(item.name || 'N/A');
				dataItem.push((item.vendor && item.vendor.short_name) ? item.vendor.short_name : 'N/A');
				dataItem.push(item.unit || 'N/A');
				const amount: any = {
					richText: []
				};
				if (!item.is_parent) {
					const item1: any = {
						font: {size: 12},
						text: TableUtil.pad(item.amount || 0, 2)
					};
					if (item.bk_total) {
						item1.font.color = {argb: '2196F3'}
					}
					amount.richText.push(item1);
					if (item.bk_total && !item.is_parent) {
						amount.richText.push({
							font: {size: 12},
							text: '\n' + TableUtil.pad(item.bk_amount || 0, 2)
						});
					}
				} else {
					amount.richText.push({
						font: {size: 12},
						text: TableUtil.pad(item.count_child || 0, 2) + ' ' +
							this.translateService.instant('FINANCE.PROJECT.LABELS.ITEMS')
					});
				}
				dataItem.push(amount);
				const price: any = {
					richText: []
				};
				if (!item.is_parent) {
					const price1: any = {
						font: {size: 12},
						text: TableUtil.getNumberFormatForExcel(item.price || 0)
					};
					if (item.bk_total) {
						price1.font.color = {argb: '2196F3'};
					}
					price.richText.push(price1);
					if (item.bk_total) {
						price.richText.push({
							font: {size: 12},
							text: '\n' + TableUtil.getNumberFormatForExcel(item.bk_price || 0)
						});
					}
				} else {
					const price1: any = {
						font: {size: 12},
						text: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL_PARENT')
					};
					const price2: any = {
						font: {size: 12},
						text: '\n' + this.translateService.instant('FINANCE.PROJECT.LABELS.REMAIN')
					};
					if ( ( item.total - item.total_children ) < 0) {
						price2.font.color = {argb: 'FD8631'};
					} else {
						price2.font.color = {argb: '38AE00'};
					}
					price.richText.push(price1);
					price.richText.push(price2);
				}
				dataItem.push(price);
				// total item
				const total: any = {
					richText: []
				};
				const item1Total: any = {
					font: {size: 12},
					text: TableUtil.getNumberFormatForExcel(item.total || 0)
				};
				if (item.bk_total) {
					item1Total.font.color = {argb: '2196F3'};
				}
				total.richText.push(item1Total);
				if (!item.is_parent) {
					if (item.bk_total) {
						total.richText.push({
							font: {size: 12},
							text: '\n' + TableUtil.getNumberFormatForExcel(item.bk_total || 0)
						});
					}
				} else {
					const other: any = {
						font: {size: 12},
						text: '\n' + TableUtil.getNumberFormatForExcel((item.total || 0) - (item.total_children || 0))
					};
					if ( ( item.total - item.total_children ) < 0) {
						other.font.color = {argb: 'FD8631'};
					} else {
						other.font.color = {argb: '38AE00'};
					}
					total.richText.push(other);
				}
				dataItem.push(total);
				dataItem.push(item.note || '');
				dataItem.push(status);
				exportData.push(dataItem);
			}
		});
		const extraData = [
			{title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'), value: TableUtil.getNumberFormatForExcel(this.footerRow.total || 0), fgColors: ['FD8631', '38AE00']}
		];
		this.excelService.exportArrayToExcel(
			exportData,
			title,
			headerSetting,
			sheetName,
			fileName,
			extraData
		);
	}

	public exportExcelPurchasingPending() {
		const headerSetting = {
			header: [
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PO_CODE'),
				this.translateService.instant('GENERAL.ATTRIBUTES.NAME'),
				this.translateService.instant('FINANCE.VENDOR.ATTRIBUTES.VENDOR'),
				this.translateService.instant('GENERAL.ATTRIBUTES.UNIT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.AMOUNT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PRICE'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.NOTE'),
				this.translateService.instant('FINANCE.COST_ITEM.ATTRIBUTES.STATUS'),
			],
			fgColor: 'ffffff',
			bgColor: '00245A',
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'purchasing pending'}),
			widths: [20, 50, 20, 20, 30, 20, 30, 30, 50]
		};
		const title = 'Purchasings Pending List';
		const sheetName = 'Purchasings_Pending';
		const fileName = `${TableUtil.slug(this.project.name || '')}_Purchasings_Pending_List`;
		const exportData: any[] = [];
		this.dataSourcePending.data.forEach((item: any) => {
			if ((item.status_name && item.status_name.name)) {
				const dataItem: any[] = [];
				const status = (item.status_name && item.status_name.name && !item.is_parent)
					? {
						value: this.translateService.instant(item.status_name.name),
						fgColor: item.status_name.color
							? item.status_name.color.replace('#', '')
							: 'FFFFFF'
					}
					: {
						value: '',
						fgColor: 'FFFFFF'
					};
				dataItem.push(item.po_id ? ('PO ' + TableUtil.pad(item.project_purchase_order.id || 0, 4)) : 'N/A');
				dataItem.push(item.name || 'N/A');
				dataItem.push((item.vendor && item.vendor.short_name) ? item.vendor.short_name : 'N/A');
				dataItem.push(item.unit || 'N/A');
				dataItem.push(TableUtil.getNumberFormatForExcel(item.amount || 0));
				dataItem.push(TableUtil.getNumberFormatForExcel(item.price || 0));
				dataItem.push(TableUtil.getNumberFormatForExcel(item.total || 0));
				dataItem.push(item.note || '');
				dataItem.push(status);
				exportData.push(dataItem);
			}
		});
		const extraData = [
			{title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'), value: TableUtil.getNumberFormatForExcel(this.footerRow.total_pending || 0), fgColors: ['FD8631', '38AE00']}
		];
		this.excelService.exportArrayToExcel(
			exportData,
			title,
			headerSetting,
			sheetName,
			fileName,
			extraData
		);
	}

}
