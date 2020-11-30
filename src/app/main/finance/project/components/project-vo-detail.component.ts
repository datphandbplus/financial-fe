import {
	OnInit, OnDestroy, Component,
	Injector, Input, ViewEncapsulation,
	ViewChild, Output, EventEmitter
} from '@angular/core';
import {
	animate, state, style,
	transition, trigger
} from '@angular/animations';
import { DialogConfirmComponent } from '@core';
import { SnackBarService, NumberService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VOService } from '@finance/project/services/vo.service';
import { DialogVORemoveComponent } from './dialog-vo-remove.component';
import { DialogVORemoveCostComponent } from './dialog-vo-remove-cost.component';
import { MatDialog, MatPaginator, MatTableDataSource } from '@angular/material';
import _ from 'underscore';

import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { DialogUploadFileComponent } from './dialog-upload-file.component';
import { ProjectLineItemService } from '@finance/project/services/project-line-item.service';
import { ProjectCostItemService } from '@finance/project/services/project-cost-item.service';
import { DialogProjectLineItemComponent } from './dialog-project-line-item.component';
import { DialogProjectCostItemComponent } from './dialog-project-cost-item.component';
import { DialogVOApproverComponent } from './dialog-vo-approver.component';

import {
	COLORS, VO_ITEM_STATUS, PROJECT_VO_STATUS, VO_APPROVE_STATUS, PROJECT_STATUS
} from '@resources';
import {MatSort} from "@angular/material/sort";

@Component({
	selector		: 'project-vo-detail',
	templateUrl		: '../templates/project-vo-detail.pug',
	styleUrls		: [ '../styles/project-vo-detail.scss' ],
	encapsulation	: ViewEncapsulation.None,
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
})
export class ProjectVODetailComponent extends ProjectBaseComponent implements OnInit, OnDestroy {
	@ViewChild(MatSort) sort: MatSort;

	@Input() public project: any;
	@Input() public projectId: number;
	@Input() public loaded: boolean;
	@Input() public canManageProject: boolean;
	@Input() public currentVO: any;

	@Output() public onBack: EventEmitter<number> = new EventEmitter<number>();

	@ViewChild( 'paginatorLine' ) set paginatorLine( paginator: MatPaginator ) {
		this.dataSourceLine.paginator = paginator;
	}
	public dataSourceLine: MatTableDataSource<any> = new MatTableDataSource<any>( [] );

	public voList: Array<any> = [];
	public voCache: any = {};
	public selectedTabIndex: number = 0;
	public VO_ITEM_STATUS: any = VO_ITEM_STATUS;
	public VO_APPROVE_STATUS: any = VO_APPROVE_STATUS;
	public PROJECT_VO_STATUS: any = PROJECT_VO_STATUS;
	public projectStatus: any = PROJECT_STATUS;
	public footer: any = {};
	public listVOColumn: Array<string> = [
		'name', 'note', 'actions',
	];
	public lineColumn: Array<string> = [
		'status', 'name', 'description',
		'unit', 'amount', 'price',
		'total', 'note', 'actions',
	];
	public voItemStatus: Array<any> = [
		{
			id		: 0,
			key		: 'ADDED',
			name	: 'FINANCE.PROJECT.LABELS.ADDED',
			color	: COLORS.SUCCESS,
			priority: 1,
		},
		{
			id		: 1,
			key		: 'REMOVED',
			name	: 'FINANCE.PROJECT.LABELS.REMOVED',
			color	: COLORS.WARN,
			priority: 0,
		},
	];
	public voStatus: Array<any> = [
		{
			id		: PROJECT_VO_STATUS.PROCESSING,
			key		: 'PROCESSING',
			name	: 'FINANCE.PROJECT.LABELS.PROCESSING',
			color	: COLORS.PRIMARY,
		},
		{
			id		: PROJECT_VO_STATUS.WAITING_APPROVAL,
			key		: 'WAITING_APPROVAL',
			name	: 'FINANCE.PROJECT.LABELS.WAITING_APPROVAL',
			color	: COLORS.WARNING,
		},
		{
			id		: PROJECT_VO_STATUS.APPROVED,
			key		: 'APPROVED',
			name	: 'FINANCE.PROJECT.LABELS.APPROVED',
			color	: COLORS.SUCCESS,
		},
		{
			id		: PROJECT_VO_STATUS.REJECTED,
			key		: 'REJECTED',
			name	: 'FINANCE.PROJECT.LABELS.REJECTED',
			color	: COLORS.WARN,
		},
		{
			id		: PROJECT_VO_STATUS.CANCELLED,
			key		: 'CANCELLED',
			name	: 'FINANCE.PROJECT.LABELS.CANCELLED',
			color	: COLORS.WARN,
		},
	];

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {Router} router
	* @param {ActivatedRoute} route
	* @param {ProjectLineItemService} projectLineItemService
	* @param {ProjectCostItemService} projectCostItemService
	* @param {VOService} voService
	*/
	constructor(
		public injector					: Injector,
		public dialog					: MatDialog,
		public snackBarService			: SnackBarService,
		public translateService			: TranslateService,
		public router					: Router,
		public route					: ActivatedRoute,
		public projectLineItemService	: ProjectLineItemService,
		public projectCostItemService	: ProjectCostItemService,
		public voService				: VOService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		if ( this.isConstruction || this.isConstructionManager ) {
			this.lineColumn.splice( 5, 2 );
		}

		this.dataSourceLine.sortingDataAccessor = (data: any, sortHeaderId: string) => {
			const value: any = data[sortHeaderId];
			return typeof value === "string" ? value.toLowerCase() : value;
		};

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
		this.getVODetail();
		this.getVODetailLine();
	}

	/**
	* VO Detail
	* @return {void}
	*/
	public getVODetail() {
		this.setProcessing( true );
		this.loaded = false;

		this.voService
		.getOne( this.currentVO.id )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;

			if ( !result || !result.id ) return;

			result.status_name = _.findWhere( this.voStatus, { id: result.status });

			result.ceo = _.findWhere( result.vo_approvers, { role_key: 'CEO' });
			result.pm = _.findWhere( result.vo_approvers, { role_key: 'PM' });
			result.procurement_manager = _.findWhere( result.vo_approvers, { role_key: 'PROCUREMENT_MANAGER' });
			result.sale = _.findWhere( result.vo_approvers, { role_key: 'SALE' });

			this.currentVO = result;
		});
	}

	/**
	* Tab changed
	* @param {number} tabIndex
	* @return {void}
	*/
	public tabChanged( tabIndex: number ) {
		this.selectedTabIndex = tabIndex;

		if ( tabIndex === 0 ) {
			this.getVODetailLine();
			return;
		}

		this.getVODetailCost();
	}

	/**
	* Get vo item list
	* @return {void}
	*/
	public getVODetailLine() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectLineItemService
		.getAll( 'query_for_vo', { vo_id: this.currentVO.id } )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;

			if ( !result ) return;

			this.footer.total_diff_vo_line = 0;

			result = _.map( result, ( item: any ) => {
				item.total = item.amount * item.price;
				item.status = item.vo_delete_id && item.vo_delete_id === this.currentVO.id
					? VO_ITEM_STATUS.REMOVED
					: VO_ITEM_STATUS.ADDED;
				item.status_name = this.voItemStatus[ item.status ];

				this.footer.total_diff_vo_line += item.status === VO_ITEM_STATUS.ADDED ? item.total : ( -1 ) * item.total;

				return item;
			});

			this.footer.discount = this.currentVO.discount_type === '$'
				? this.currentVO.discount_amount
				: this.currentVO.discount_amount * this.footer.total_diff_vo_line / 100;
			this.footer.total_wo_vat = this.footer.total_diff_vo_line - this.footer.discount;
			this.footer.vat = this.footer.total_wo_vat * this.currentVO.vat_percent / 100;
			this.footer.total_w_vat = this.footer.total_wo_vat + this.footer.vat;

			this.voCache[ this.currentVO.id ] = result;
			this.dataSourceLine.sort = this.sort;
			this.dataSourceLine.data = result;
		});
	}

	/**
	* Get vo item list
	* @return {void}
	*/
	public getVODetailCost() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectCostItemService
		.getAll( this.currentVO.project_id, 'query_for_vo', { vo_id: this.currentVO.id } )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;

			if ( !result ) return;

			this.footer.total_diff_vo_line = 0;

			result = _.map( result, ( item: any ) => {
				item.status = item.vo_delete_id && item.vo_delete_id === this.currentVO.id
					? VO_ITEM_STATUS.REMOVED
					: VO_ITEM_STATUS.ADDED;
				item.final_amount = item.status === VO_ITEM_STATUS.REMOVED ? item.amount : ( item.bk_amount || item.amount );
				item.final_price = item.status === VO_ITEM_STATUS.REMOVED ? item.price : ( item.bk_price || item.price );
				item.total = item.final_amount * item.final_price;
				item.status_name = this.voItemStatus[ item.status ];

				this.footer.total_diff_vo_line += item.status === VO_ITEM_STATUS.ADDED ? item.total : ( -1 ) * item.total;

				return item;
			});

			this.voCache[ this.currentVO.id ] = result;
			this.dataSourceLine.data = result;
		});
	}

	/**
	* Open dialog import file
	* @param {string} destination
	* @return {void}
	*/
	public openDialogUploadCostFile( destination: string = 'cost' ) {
		const dialogRef: any = this.dialog.open(
			DialogUploadFileComponent,
			{
				width: '400px',
				data: {
					upload_file_destination	: destination,
					project_id				: this.projectId,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result || !result.file_location ) return;

			this.uploadCost( result.file_location );
		} );
	}

	/**
	* Upload
	* @param {File} fileLocation
	* @param {string} action
	* @return {void}
	*/
	public uploadCost( fileLocation: File, action: string = 'addnew' ) {
		this.loaded = false;
		this.projectCostItemService
		.upload( fileLocation, { project_id: this.projectId, vo_id: this.currentVO.id }, action )
		.subscribe( ( result: any ) => {
			this.loaded = true;

			if ( !result || !result.status ) {
				if ( result && result.message === 'INVALID_FILE_TYPE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_TYPE' );
					return;
				}

				if ( result && result.message === 'INVALID_FILE_SIZE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_SIZE' );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPLOAD_PROJECT_COST_ITEMS_FAIL' );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPLOAD_PROJECT_COST_ITEMS_SUCCESS', result.data );
			this.getVODetailCost();
		} );
	}

	/**
	* Open dialog import file
	* @param {string} destination
	* @return {void}
	*/
	public openDialogUploadLineFile( destination: string = 'line' ) {
		const dialogRef: any = this.dialog.open(
			DialogUploadFileComponent,
			{
				width: '400px',
				data: {
					upload_file_destination	: destination,
					project_id				: this.projectId,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result || !result.file_location ) return;

			this.uploadLine( result.file_location );
		} );
	}

	/**
	* Upload
	* @param {File} fileLocation
	* @param {string} action
	* @return {void}
	*/
	public uploadLine( fileLocation: File, action: string = 'addnew' ) {
		this.loaded = false;
		this.projectLineItemService
		.upload( fileLocation, { project_id: this.projectId, vo_id: this.currentVO.id }, action )
		.subscribe( ( result: any ) => {
			this.loaded = true;

			if ( !result || !result.status ) {
				if ( result && result.message === 'INVALID_FILE_TYPE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_TYPE' );
					return;
				}

				if ( result && result.message === 'INVALID_FILE_SIZE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_SIZE' );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPLOAD_PROJECT_LINE_ITEMS_FAIL' );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPLOAD_PROJECT_LINE_ITEMS_SUCCESS', result.data );
			this.getVODetailLine();
		} );
	}

	/**
	* Open dialog project line item to create/update
	* @param {any} data - Sheet data need create/update
	* @return {void}
	*/
	public openDialogProjectLineItem( data: any = {} ) {
		const dialogRef: any = this.dialog.open(
			DialogProjectLineItemComponent,
			{
				width: '750px',
				data: {
					vo_add_id				: this.currentVO.id,
					project_sheet_name		: this.currentVO.name,
					groups					: [],
					child_groups			: [],
					id						: data.id,
					line_item_category_id	: data.line_item_category_id,
					name					: data.name,
					unit					: data.unit,
					amount					: +data.amount,
					price					: +data.price,
					description				: data.description,
					note					: data.note,
					image					: data.image,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getVODetailLine();
		} );
	}

	/**
	* Open dialog project cost item to create/update
	* @param {any} data - Project line item data need create/update
	* @return {void}
	*/
	public openDialogProjectCostItem( data: any = {} ) {
		const vendor: any = data.vendor;
		const dialogData: any = {
			project_id				: this.projectId,
			vo_id					: this.currentVO.id,
			project_name			: this.project.name,
			project_quotation_status: this.project.quotation_status,
			project_line_item		: data.project_line_item,
			vendor_id				: vendor && vendor.id,
			vendor_category_id		: vendor && vendor.vendor_category && vendor.vendor_category.id,
			cost_item_category_id	: data.cost_item_category_id,
			id						: data.id,
			name					: data.name,
			unit					: data.unit,
			amount					: data.amount,
			price					: data.price,
			note					: data.note,
			description				: data.description,
			image					: data.image,
		};

		const dialogRef: any = this.dialog.open(
			DialogProjectCostItemComponent,
			{
				width	: '750px',
				data	: dialogData,
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getVODetailCost();
		} );
	}

	/**
	* Delete project line item
	* @param {any} lineItem - Sheet data need delete
	* @return {void}
	*/
	public deleteProjectLineItem( lineItem: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DELETE_LINE_ITEM' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DELETE_LINE_ITEM_CONFIRMATION', lineItem ),
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

			this.voService
			.removeLine( this.currentVO.id, lineItem.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_LINE_ITEM_FAIL', lineItem );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_LINE_ITEM_SUCCESS', lineItem );

				this.getVODetailLine();
			} );
		} );
	}

	/**
	* Delete project cost item
	* @param {any} costItem - Sheet data need delete
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

			this.voService
			.removeCost( this.currentVO.id, costItem.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_COST_ITEM_FAIL', costItem );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_COST_ITEM_SUCCESS', costItem );

				this.getVODetailCost();
			} );
		} );
	}

	/**
	* Open dialog vo remove
	* @param {any} vo - vo data need create/update
	* @return {void}
	*/
	public openDialogRemoveLine() {
		const dialogRef: any = this.dialog.open(
			DialogVORemoveComponent,
			{
				width: '950px',
				data: {
					project_id	: this.projectId,
					project_name: this.project.name,
					...this.currentVO,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getVODetailLine();
		} );
	}

	/**
	* Open dialog vo remove
	* @param {any} vo - vo data need create/update
	* @return {void}
	*/
	public openDialogRemoveCost() {
		const dialogRef: any = this.dialog.open(
			DialogVORemoveCostComponent,
			{
				width: '950px',
				data: {
					project_id	: this.projectId,
					project_name: this.project.name,
					...this.currentVO,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getVODetailCost();
		} );
	}

	/**
	* getApproval
	* @param {number} status
	* @return {void}
	*/
	public getApproval( status: number ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.PROCESSING' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.PROCESSING_CONFIRMATION', this.currentVO ),
					actions: {
						yes: { color: 'primary' },
					},
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			this.loaded = false;
			this.voService
			.getApproval( this.currentVO.id, { status })
			.subscribe( ( result: any ) => {
				this.loaded = true;

				if ( result.message === 'REMAINING_INVALID' ) {
					if ( !result || !result.status ) {
						this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.REMAINING_INVALID', {
							...this.currentVO,
							remaining: NumberService.addCommas( result.data.remaining ),
						});
						return;
					}

					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.PROCESSING_FAIL', this.currentVO );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.PROCESSING_SUCCESS', this.currentVO );

				this.getVODetail();
			} );
		} );
	}

	/**
	* approveVO
	* @return {void}
	*/
	public approveVO() {
		const dialogRef: any = this.dialog.open(
			DialogVOApproverComponent,
			{
				width: '950px',
				data: this.currentVO,
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			result && this.getVODetail();
		} );
	}

	/**
	* Download template
	* @return {void}
	*/
	public downloadLine() {
		this.projectLineItemService
		.download()
		.subscribe( ( result: any ) => {
			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DOWNLOAD_TEMPLATE_FAIL' );
				return;
			}

			const win: any = window.open( result.data, '_blank' );
			win.focus();
		} );
	}

	/**
	* Download template
	* @return {void}
	*/
	public downloadCost() {
		this.projectCostItemService
		.download()
		.subscribe( ( result: any ) => {
			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DOWNLOAD_TEMPLATE_FAIL' );
				return;
			}

			const win: any = window.open( result.data, '_blank' );
			win.focus();
		} );
	}

}
