import {
	OnInit, OnDestroy, Component,
	Injector, Input, ViewEncapsulation,
	Output, EventEmitter, ViewChild
} from '@angular/core';
import { SnackBarService } from 'angular-core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource, MatDialog } from '@angular/material';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import _ from 'underscore';
import moment from 'moment-timezone';

import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { DialogModificationStatusComponent } from './dialog-modification-status.component';
import { ProjectService } from '@finance/project/services/project.service';
import { ProjectCostModificationService } from '@finance/project/services/project-cost-modification.service';
import { ProjectCostItemService } from '@finance/project/services/project-cost-item.service';
import { UserService } from '@finance/user/services/user.service';
import {COST_MODIFICATION_STATUS, MODIFIED_STATUS, PROJECT_STATUS, PURCHASE_ORDER_STATUS} from '@resources';
import { NumberService } from '@core';
import {ProjectPurchaseOrderService} from "@finance/project/services/project-purchase-order.service";
import {TableUtil} from "@app/utils/tableUtils";
import {ExcelService} from "@ext/lezo/services/excel.service";
import {TranslateService} from "@ngx-translate/core";

@Component({
	selector		: 'project-config',
	templateUrl		: '../templates/project-config.pug',
	styleUrls		: [ '../styles/project-config.scss' ],
	encapsulation	: ViewEncapsulation.None,
})
export class ProjectConfigComponent extends ProjectBaseComponent implements OnInit, OnDestroy {

	@Input() public project: any;
	@Input() public projectId: number;
	@Input() public loaded: boolean;
	@Input() public canManageProject: boolean;

	@Output() public refreshProjectDetail: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild(MatSort) sort: MatSort;

	public subTotalItemCostVo: number = 0;
	public subTotalsVo: number = 0;
	public totalsPurchasing: number = 0;
	public totalsItemCost: number = 0;
	public totalListPurchasing: number = 0;
	public projectConfig: any;
	public managementForm: FormGroup;
	public projectUserForm: FormGroup;
	public costModifications: Array<any> = [];
	public COST_MODIFICATION_STATUS: any = COST_MODIFICATION_STATUS;
	public dataSource: MatTableDataSource<any> = new MatTableDataSource<any>( [] );
	public currentDate: any = moment();
	public displayedColumns: Array<string> = [
		'no', 'po', 'name',
		'vendor', 'old_total', 'new_total',
		'difference', 'compare', 'approve_by',
		'status', 'actions',
	];
	public filteredPO: Array<any> = [];
	public poFilters: any = {};
	public totalLineItem: number;
	public totalBaseCostItem: number;
	public totalCostModified: number;
	public totalCostPending: number;
	public isSubmitting: boolean;
	public isOverTotalExtraFee: boolean;
	public filteredVendor: Array<any> = [];
	public filters: any = {};
	public footerRow: any = { old_total: 0, new_total: 0, difference: 0 };
	public totalSum: any = {
		total : 0,
		total_vat: 0,
		subtotal: 0
	};

	/**
	* @constructor
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {MatDialog} dialog
	* @param {SnackBarService} snackBarService
	* @param {Router} router
	* @param {ActivatedRoute} route
	* @param {ProjectService} projectService
	* @param {ProjectCostItemService} projectCostItemService
	* @param {ProjectCostModificationService} projectCostModificationService
	* @param {UserService} userService
	*/
	constructor(
		public injector							: Injector,
		public fb								: FormBuilder,
		public dialog							: MatDialog,
		public snackBarService					: SnackBarService,
		public router							: Router,
		public route							: ActivatedRoute,
		public projectService					: ProjectService,
		public projectCostItemService			: ProjectCostItemService,
		public projectCostModificationService	: ProjectCostModificationService,
		public userService						: UserService,
		public projectPurchaseOrderService		: ProjectPurchaseOrderService,
		public translateService					: TranslateService,
		public excelService						: ExcelService
	) {
		super( injector );

		this.managementForm = fb.group({
			exchange_rate: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 1 ),
				]),
			],
			project_status: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.pattern(
						new RegExp( _.values( PROJECT_STATUS ).join( '|' ) )
					),
				]),
			],
			valid_duration: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 1 ),
				]),
			],
			management_fee: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			total_extra_fee: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			extra_cost_fee: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			max_po_price: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
		});

		this.projectUserForm = fb.group({
			manage_by: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			sale_by: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			qs_by: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			purchase_by: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			construct_by: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
			const value: any = data[sortHeaderId];
			return typeof value === "string" ? value.toLowerCase() : value;
		};
		this.dataSource.sort = this.sort;
		this.projectConfig = _.clone(this.project);

		if ( isNaN( this.projectId ) ) {
			this.backToList();
			return;
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

		this.getList();
		this.getPOList();
		this.getListItemCost();
		this.getProjectConfig();
		this.getListCost();
	}

	/**
	* Back to projects list
	* @return {void}
	*/
	public backToList() {
		this.router.navigate( [ 'finance/project' ] );
	}

	/**
	* Open dialog to create/update
	* @param {any} costModification - Cost modification to update
	* @return {void}
	*/
	public openDialog( costModification: any) {
		const dialogRef: any = this.dialog.open(
			DialogModificationStatusComponent,
			{
				width	: '450px',
				data	: costModification,
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getProjectCostModifications();
			this.refreshProjectDetail.emit();
		} );
	}

	/**
	* Get project config
	* @return {void}
	*/
	public getProjectConfig() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectService
		.getOne( this.projectId, 'project_config' )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			this.totalLineItem = 0;
			this.projectConfig.exchange_rate = result.exchange_rate;
			this.projectConfig.project_status = result.project_status;
			this.projectConfig.valid_duration = result.valid_duration;
			this.projectConfig.management_fee = result.management_fee;
			this.projectConfig.total_extra_fee = result.total_extra_fee;
			this.projectConfig.extra_cost_fee = result.extra_cost_fee;
			this.projectConfig.max_po_price = result.max_po_price;
			this.projectConfig.project_status_name = _.findWhere( this.projectStatus, { id: result.project_status || 0 } );

			let totalLine: number = 0;

			_.each( result.project_sheets, ( item: any ) => {
				_.each( item.project_line_items, ( projectLineItemItem: any ) => {
					totalLine += +projectLineItemItem.price * +projectLineItemItem.amount;
				});
			} );

			const discountValue: number = this.project.discount_type === '$'
				? this.project.discount_amount
				: totalLine * this.project.discount_amount / 100;

			let vo_total = 0;
			_.each( result.project_vo, ( item: any ) => {
				vo_total += item.diff_quotation_vat + item.diff_quotation_total;
			} );

			this.totalLineItem = (totalLine - discountValue) * 1.1 + vo_total;

			this.getProjectCostModifications();
		} );
	}

	/**
	* Get project cost modifications
	* @return {void}
	*/
	public getProjectCostModifications() {
		let _filteredPO: Array<any> = [];

		this.projectCostModificationService
		.getAll( this.projectId )
		.subscribe( ( result: any ) => {
			this.totalCostPending = 0;
			this.filteredVendor = [];
			this.filters = {};

			const _projectCosts: any = result;
			const vendorIds: Array<number> = [];
			const statusIds: Array<number> = [];
			const _filteredVendor: any = {};

			_.each( _projectCosts, ( item: any ) => {
				const oldTotal: number = item.old_amount * item.old_price;
				const newTotal: number = item.new_amount * item.new_price;
				const difference: number = newTotal - oldTotal;

				item.old_total = oldTotal;
				item.new_total = newTotal;
				item.difference = difference;
				item.difference_percent = difference / ( oldTotal || newTotal ) * 100;
				item.compare = item.difference / ( this.totalBaseCostItem || 1 ) * 100;
				item.status_priority = 0;

				if ( item.project_cost_item_id ) {
					item.status_name = _.findWhere( this.projectCostModificationStatus, { id: item.status } );
				} else {
					// Removed status
					item.status_name = this.projectCostModificationStatus.slice( -1 ).pop();
					item.status = item.status_name.id; // Overwrite status
				}

				if ( _.contains(
					[ COST_MODIFICATION_STATUS.APPROVED, COST_MODIFICATION_STATUS.VALID ],
					item.status ) ) {
					item.status_priority = 1;
				}

				if ( item.status === COST_MODIFICATION_STATUS.WAITING ) {
					this.totalCostPending += difference;
					item.status_priority = 2;
				}

				item.status_name && item.status_name.id >= 0 && statusIds.push( item.status_name.id );
				item.vendor && item.vendor.id && vendorIds.push( item.vendor.id );


				if(item.vendor_id){
					vendorIds.push( item.vendor_id );
					!_filteredVendor[ item.vendor_id ] && ( _filteredVendor[ item.vendor_id ] = {
						id			: item.vendor_id,
						vendor_name	: item.vendor_name,
						vendor_name_vi	: item.vendor_name_vi,
					});
					item.vendor_name_vi = (this.removeAccents(item.vendor_name)).toLowerCase();
				}else{
					item.vendor_id = 0;
					vendorIds.push( 0 );
					!_filteredVendor[ 0 ] && ( _filteredVendor[ 0 ] = {
						id			: 0,
						vendor_name	: '',
					});
				}

				item.name = item.name.charAt(0).toUpperCase() + item.name.slice(1);
				// if ( item.vendor && item.vendor.id ) {
				// 	vendorIds.push( item.vendor.id );
				// 	!_filteredVendor[ item.vendor.id ] && ( _filteredVendor[ item.vendor.id ] = {
				// 		id			: item.vendor.id,
				// 		vendor_name	: item.vendor.vendor_name,
				// 	});
				// } else {
				// 	item.vendor_id = 0;
				// 	vendorIds.push( 0 );
				// 	!_filteredVendor[ 0 ] && ( _filteredVendor[ 0 ] = {
				// 		id			: 0,
				// 		vendor_name	: 'N/A',
				// 	});
				// }

				item.po_name = item.po_code
					? 'PO' + NumberService.padNumberFormatter( item.po_code, 4 )
					: null;

				item.po_code = item.po_name

				_filteredPO.push(item.po_code);
			} );

			_filteredPO = _.uniq( _filteredPO );

			_filteredPO = _.map(_filteredPO, value => { return { id: value, name: value } });

			this.filteredPO = _filteredPO;
			this.filters[ 'status_name.id' ] = _.uniq( statusIds );
			this.filters.vendor_id = _.uniq( vendorIds );
			this.filteredVendor = _.values( _filteredVendor );

			this.costModifications = _projectCosts;
			this.dataSource.data = this.customSortDataSource( _projectCosts );
			this.customFilter();
		} );

		this.setProcessing( true );
		this.loaded = false;

		this.projectCostItemService
		.getAll( this.projectId, 'cost_modified' )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;

			if ( !result ) return;

			this.totalCostModified = +result.modified - +result.base;
			this.totalBaseCostItem = result.base;
			this.isOverTotalExtraFee = ( this.totalCostModified / ( this.totalBaseCostItem || 1 ) * 100 ) > this.project.total_extra_fee;
		});
	}

	/**
	* Custom sort data source
	* @param {any} dataSourceClone
	* @return {array}
	*/
	public customSortDataSource( dataSourceClone: any ) {
		const data: Array<any> = _.clone( dataSourceClone );

		data.sort( ( a: any, b: any ) => b.status_priority - a.status_priority );

		return data;
	}

	/**
	* Update project
	* @return {void}
	*/
	public updateProjectConfig() {
		this.isSubmitting = true;

		this.projectService
		.updateProjectConfig( this.project.id, this.projectConfig )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_FAIL', this.project );
				return;
			}

			this.project.exchange_rate = this.projectConfig.exchange_rate;
			this.project.project_status = this.projectConfig.project_status;
			this.project.valid_duration = this.projectConfig.valid_duration;
			this.project.management_fee = this.projectConfig.management_fee;
			this.project.total_extra_fee = this.projectConfig.total_extra_fee;
			this.project.extra_cost_fee = this.projectConfig.extra_cost_fee;
			this.project.max_po_price = this.projectConfig.max_po_price;

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_SUCCESS', this.project );

			this.getProjectConfig();
		} );
	}

	/**
	* On change project status
	* @return {void}
	*/
	public onChangeProjectStatus() {
		this.project.project_status_name = _.findWhere( this.projectStatus, { id: this.project.project_status || 0 } );
	}

	/**
	* Update project user
	* @return {void}
	*/
	public updateProjectUser() {
		this.isSubmitting = true;

		this.projectService
		.changeProjectUser( this.project.id, this.projectConfig )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_FAIL', this.project );
				return;
			}

			this.project.manage_by 	  = this.projectConfig.manage_by
			this.project.sale_by 	  = this.projectConfig.sale_by
			this.project.qs_by 		  = this.projectConfig.qs_by
			this.project.purchase_by  = this.projectConfig.purchase_by
			this.project.construct_by = this.projectConfig.construct_by

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_SUCCESS', this.project );

			this.getProjectConfig();
		} );
	}

	/**
	* Custom filter
	* @return {void}
	*/
	public customFilter() {
		this.applyFilter();
		this.customTotal();
	}

	/**
	* Custom Total
	* @return {void}
	*/
	public customTotal() {
		let oldTotal: number = 0;
		let newTotal: number = 0;
		let difference: number = 0;

		_.each( this.dataSource.filteredData, ( item: any ) => {
			oldTotal += item.old_total;
			newTotal += item.new_total;
			difference += item.difference;
		} );

		this.footerRow.old_total = oldTotal;
		this.footerRow.new_total = newTotal;
		this.footerRow.difference = difference;
	}

	/**
	 * Get project bills
	 * @return {any}
	 */
	public getPOList() {
		this.loaded = false;
		this.projectPurchaseOrderService
			.getAll( this.projectId )
			.subscribe( ( result: any ) => {
				this.setProcessing( false );
				this.loaded = true;
				_.map( result, ( item: any ) => {
					item.total = 0;
					item.new_total = 0;
					item.total_vat = 0;

					item.po_code = item.id
						? 'PO' + NumberService.padNumberFormatter( item.id, 4 )
						: null;

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

					item.planed = 0;
					item.vat_planed = 0;
					_.each( item.project_payments, ( payment: any ) => {
						item.planed += payment.total_real || payment.total || 0;
						item.vat_planed += isNaN( payment.total_vat_real )
							? ( payment.total_vat || 0 )
							: +payment.total_vat_real;
					});
					this.totalSum.total += item.total;
					this.totalSum.total_vat += item.total_vat;
					this.totalSum.subtotal += item.subtotal;
				});
			} );
	}


	/**
	 * Get project bills
	 * @param {any} oldData
	 * @return {void}
	 */
	public getListItemCost() {
		this.loaded = false;
		this.projectCostItemService
			.getAll( this.projectId, 'quotation_approved' )
			.subscribe( ( result: any ) => {
				this.setProcessing( false );
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
				this.totalsItemCost += totalPurchasing;
				this.loaded = true;

			} );
	}


	/**
	 * Get project bills
	 * @return {void}
	 */
	public getListCost() {
		this.setProcessing( true );
		this.loaded = false;
		this.projectCostItemService
			.getAll( this.projectId )
			.subscribe( ( result: any ) => {
				this.setProcessing( false );
				this.loaded = true;
				let sub_total = 0;
				let vo_total = 0;
				_.map( result, ( item: any ) => {
					if ( item.bk_price !== null ) item.total = item.bk_amount * item.bk_price;
					else item.total = item.price * item.amount;

					if ( item.vo_add_id !== null || item.vo_delete_id !== null ) {
						vo_total += item.vo_add_id !== null ? item.total : -item.total;
					} else {
						sub_total += item.total;
					}
				} );

				this.subTotalItemCostVo = sub_total + vo_total;
			} );
	}

	/**
	 * Get project bills
	 * @param {any} oldData
	 * @return {void}
	 */
	public getList() {
		this.loaded = false;

		this.projectCostItemService
			.getAll( this.projectId, 'quotation_approved' )
			.subscribe( ( result: any ) => {
				this.setProcessing( false );

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
				this.totalListPurchasing += totalPurchasing;
				this.loaded = true;
			} );
	}


	/**
	* Apply filter purchasing order list
	* @return {void}
	*/
	public applyFilterPO() {
		this.dataSource.filterPredicate = ( data: any, filters: any ) => {
			let flag: boolean = true;

			_.each( filters, ( filter: any, key: string ) => {
				if ( !flag
					|| filter === null
					|| filter === undefined ) {
					return;
				}

				const value: any = _.get( data, key );

				// Range filter
				if ( !isNaN( filter.min ) && !isNaN( filter.max ) ) {
					flag = value >= filter.min && value <= filter.max;
					return;
				}

				flag = value === filter || _.contains( filter, value );
			} );

			return flag;
		};

		this.dataSource.filter = this.poFilters;
		this.customTotal();
	}

	/**
	 * Convert vi to en
	 * @param {string} dataSourceClone
	 * @return {string}
	 */
	public removeAccents(str) {
		var AccentsMap = [
			"aàảãáạăằẳẵắặâầẩẫấậ",
			"AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬ",
			"dđ", "DĐ",
			"eèẻẽéẹêềểễếệ",
			"EÈẺẼÉẸÊỀỂỄẾỆ",
			"iìỉĩíị",
			"IÌỈĨÍỊ",
			"oòỏõóọôồổỗốộơờởỡớợ",
			"OÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢ",
			"uùủũúụưừửữứự",
			"UÙỦŨÚỤƯỪỬỮỨỰ",
			"yỳỷỹýỵ",
			"YỲỶỸÝỴ"
		];
		for (var i=0; i<AccentsMap.length; i++) {
			var re = new RegExp('[' + AccentsMap[i].substr(1) + ']', 'g');
			var char = AccentsMap[i][0];
			str = str.replace(re, char);
		}
		return str;
	}

	/**
	 * Download template
	 * @return {void}
	 */
	public exportExcel() {
		const _this = this;
		this.projectCostItemService
			.getAll( this.projectId, 'cost_modified' )
			.subscribe( ( result: any ) => {
				if ( !result ) return;

				_this.totalCostModified = +result.modified - +result.base;
				_this.totalBaseCostItem = result.base;
				_this.isOverTotalExtraFee = ( _this.totalCostModified / ( _this.totalBaseCostItem || 1 ) * 100 ) > _this.project.total_extra_fee;
				const title = 'Cost Modification List';
				const sheetName = 'Cost Modification';
				const fileName = `${TableUtil.slug(_this.project.name || '')}_Config_Statistic`;
				const infoDatas = [
					{
						data: [
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.EXCHANGE_RATE'),
								value: _this.projectConfig.exchange_rate ? TableUtil.pad(_this.projectConfig.exchange_rate, 2) : ''
							},
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.PROJECT_STATUS'),
								value: (_this.projectConfig.project_status_name && _this.projectConfig.project_status_name.name)
									? _this.translateService.instant(_this.projectConfig.project_status_name.name)
									: 'N/A',
								bgColor:  (_this.projectConfig.project_status_name && _this.projectConfig.project_status_name.color)
									? _this.projectConfig.project_status_name.color.replace('#', '')
									: ''
							},
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.MINIMUM_PAYMENT_PERIOD'),
								value: _this.projectConfig.valid_duration || 0
							}
						],
						cols: 3,
						blockTitle: _this.translateService.instant('FINANCE.PROJECT.LABELS.PROJECT_CONFIG').toUpperCase()
					},
					{
						data: [
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.MANAGEMENT_FEE'),
								value: (_this.projectConfig.management_fee ? TableUtil.getNumberFormatForExcel(_this.projectConfig.management_fee) : 0) + '%'
							},
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL_EXTRA_FEE'),
								value: (_this.projectConfig.total_extra_fee ? TableUtil.getNumberFormatForExcel(_this.projectConfig.total_extra_fee) : 0) + '%'
							},
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.EXTRA_COST_FEE'),
								value: (_this.projectConfig.extra_cost_fee ? TableUtil.getNumberFormatForExcel(_this.projectConfig.extra_cost_fee) : 0) + '%'
							},
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.MAX_PO_PRICE'),
								value: (_this.projectConfig.max_po_price ? TableUtil.getNumberFormatForExcel(_this.projectConfig.max_po_price) : 0)
							}
						],
						cols: 4,
						blockTitle: _this.translateService.instant('FINANCE.PROJECT.LABELS.MANAGEMENT_COSTS_INCURRED').toUpperCase()
					},
					{
						data: [
							{
								title: _this.translateService.instant('FINANCE.USER.LABELS.PM'),
								value: _this.projectConfig.manage_by || ''
							},
							{
								title: _this.translateService.instant('FINANCE.USER.LABELS.SALE'),
								value: _this.projectConfig.sale_by || ''
							},
							{
								title: _this.translateService.instant('FINANCE.USER.LABELS.QS'),
								value: _this.projectConfig.qs_by || ''
							},
							{
								title: _this.translateService.instant('FINANCE.USER.LABELS.PURCHASING'),
								value: _this.projectConfig.purchase_by || ''
							},
							{
								title: _this.translateService.instant('FINANCE.USER.LABELS.CONSTRUCTION'),
								value: _this.projectConfig.construct_by || ''
							}
						],
						cols: 3,
						blockTitle: _this.translateService.instant('FINANCE.PROJECT.LABELS.PROJECT_USER_ROLE').toUpperCase()
					},
					{
						data: [
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL_LINE_ITEM'),
								value: TableUtil.getNumberFormatForExcel(_this.totalLineItem || 0)
							},
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL_COST_ITEM'),
								value: TableUtil.getNumberFormatForExcel(_this.totalBaseCostItem || 0)
							},
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL_EXTRA_FEE'),
								richText: [
									{
										font: {name: 'Tahoma', family: 4, sixe: 12},
										text: TableUtil.getNumberFormatForExcel( (_this.totalSum.total || 0)  + (_this.totalListPurchasing || 0) - (_this.subTotalItemCostVo || 0))
									},
									{
										font: {name: 'Tahoma', family: 4, sixe: 12, color: {argb: (( (_this.totalSum.total || 0)  + (_this.totalListPurchasing || 0) - (_this.subTotalItemCostVo || 0)) < 0) ? '38AE00' : 'FF0000'}},
										text: ' ( ' +
											TableUtil.getNumberFormatForExcel(((_this.totalSum.total || 0)  + (_this.totalListPurchasing || 0) - (_this.subTotalItemCostVo || 0))/(_this.subTotalItemCostVo || 1) * 100, 2) + '% )'
									}
								]
							},
							{
								title: _this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL_EXTRA_FEE_PENDING'),
								value: TableUtil.getNumberFormatForExcel( _this.totalCostPending || 0 ) + ' ( ' +
									TableUtil.getNumberFormatForExcel((_this.totalCostPending || 0) / ( _this.totalBaseCostItem || 1 ) * 100) + '% )'
							}
						],
						cols: 4,
						blockTitle: _this.translateService.instant('FINANCE.PROJECT.LABELS.FINANE_STATISTICS').toUpperCase()
					}
				];
				const headerSetting: any = {
					header: [
						_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PO_CODE'),
						_this.translateService.instant('GENERAL.ATTRIBUTES.ITEMS'),
						_this.translateService.instant('FINANCE.VENDOR.ATTRIBUTES.VENDOR'),
						_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.OLD_TOTAL'),
						_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.NEW_TOTAL'),
						_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.DIFFERENCE'),
						_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.COMPARE_WITH_TOTAL'),
						_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.APPROVE_BY'),
						_this.translateService.instant('GENERAL.ATTRIBUTES.STATUS')
					],
					fgColor: 'ffffff',
					bgColor: '00245A',
					widths: [20,50,30,20,20,35,20,20,20],
					noData: _this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'cost'})
				};
				const exportData: any[] = [];
				_this.dataSource.data.forEach((item: any) => {
					const dataItem: any[] = [];
					dataItem.push(item.po_name || 'N/A');
					dataItem.push(item.name || 'N/A');
					dataItem.push(item.vendor_name || 'N/A');
					dataItem.push(TableUtil.getNumberFormatForExcel(item.old_total || 0));
					dataItem.push(TableUtil.getNumberFormatForExcel(item.new_total || 0));
					const difference: any = {
						richText: [
							{
								font: {name: 'Tahoma', family: 4, size: 12},
								text: TableUtil.getNumberFormatForExcel(item.difference || 0, 0) + ` ( ${TableUtil.getNumberFormatForExcel(item.difference_percent || 0, (Number.isInteger(item.difference_percent) ? 0 : 2))}% )`
							}
						]
					};
					if (item.difference <= 0) {
						difference.richText[0].font.color = {argb: '38AE00'};
					} else {
						difference.richText[0].font.color = {argb: 'FD8631'};
					}
					dataItem.push(difference);
					const compare: any = {
						richText: [
							{
								font: {name: 'Tahoma', family: 4, size: 12},
								text: TableUtil.getNumberFormatForExcel( (item.difference || 0) / ( _this.totalBaseCostItem || 1 ) * 100 , 2)
							}
						]
					};
					if (item.difference <= 0) {
						compare.richText[0].font.color = {argb: '38AE00'};
					} else {
						compare.richText[0].font.color = {argb: 'FD8631'};
					}
					dataItem.push(compare);
					dataItem.push((item.user && item.user.full_name) ? item.user.full_name : 'N/A');
					const status = (item.status_name && item.status_name.name) ? {value: _this.translateService.instant(item.status_name.name), fgColor: item.status_name.color ? item.status_name.color.replace('#', '') : 'FF0000'} : {value: '', fgColor: 'FF0000'};
					dataItem.push(status);
					exportData.push(dataItem)
				});
				const extraData = [
					{
						title: _this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.OLD_TOTAL'),
						value: TableUtil.getNumberFormatForExcel(_this.footerRow.old_total || 0),
						fgColors: ['38AE00', 'FD8631']
					},
					{
						title: _this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.NEW_TOTAL'),
						value: TableUtil.getNumberFormatForExcel(_this.footerRow.new_total || 0),
						fgColors: ['38AE00', 'FD8631']
					},
					{
						title: _this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.DIFFERENCE'),
						value: TableUtil.getNumberFormatForExcel(_this.footerRow.difference || 0),
						fgColors: ['38AE00', 'FD8631']
					}
				];
				_this.excelService.exportArrayMultiDataInfoToExcel(
					exportData,
					title,
					headerSetting,
					sheetName,
					fileName,
					extraData,
					infoDatas
				);
			});

	}

}
