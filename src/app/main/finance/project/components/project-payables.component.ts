import {
	OnInit, OnDestroy, Component,
	Injector, Input, ViewChild,
	Output, EventEmitter
} from '@angular/core';
import { MatDialog, MatPaginator, MatTableDataSource } from '@angular/material';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import _ from 'underscore';
import moment from 'moment-timezone';

import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { DialogProjectPaymentComponent } from './dialog-project-payment.component';
import { DialogProjectPaymentInvoiceComponent } from './dialog-project-payment-invoice.component';
import { DialogProjectPaymentOrderComponent } from './dialog-project-payment-order.component';
import { DialogProjectPaymentPlanComponent } from './dialog-project-payment-plan.component';
import { DialogProjectPaymentApproverComponent } from './dialog-project-payment-approver.component';
import { DialogPlanApproverComponent } from './dialog-plan-approver.component';
import { ProjectService } from '@finance/project/services/project.service';
import { ProjectPaymentService } from '@finance/project/services/project-payment.service';
import { ProjectPaymentPlanService } from '@finance/project/services/project-payment-plan.service';
import {MatSort} from "@angular/material/sort";
import { DialogConfirmComponent, NumberService } from '@core';
import {
	PAYMENT_STATUS, PLAN_STATUS, PROCEDURE_STATUS,
	PAYMENT_APPROVE_STATUS, QUOTATION_STATUS, PURCHASE_ORDER_STATUS
} from '@resources';
import {TableUtil} from "@app/utils/tableUtils";
import {ExcelService} from "@ext/lezo/services/excel.service";

declare var window: Window;

@Component({
	selector	: 'project-payables',
	templateUrl	: '../templates/project-payables.pug',
	styleUrls	: [ '../styles/project-payables.scss' ],
})
export class ProjectPayablesComponent extends ProjectBaseComponent implements OnInit, OnDestroy {

	@Input() public project: any;
	@Input() public projectId: number;
	@Input() public loaded: boolean;
	@Input() public activePaymentId: number;
	@Input() public canManageBill: boolean;

	@Output() public refreshProjectDetail: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild( 'paymentPlanSort' ) paymentPlanSort: MatSort;
	@ViewChild( 'paymentSort' ) paymentSort: MatSort;

	@ViewChild( 'paginatorPaymentPlan' ) set paginatorPaymentPlan( paginator: MatPaginator ) {
		this.paymentPlanDataSource.paginator = paginator;
	}

	public paymentPlanDataSource: MatTableDataSource<any> = new MatTableDataSource<any>( [] );
	public displayedColumns: Array<string> = [
		'po', 'vendor', 'amount',
		'vat', 'total', 'invoice_date',
		'pay_date', 'procedure', 'status',
		'approve_status', 'invoice',
		'payment_order', 'actions',
	];
	public paymentPlanDisplayedColumns: Array<string> = [
		'name', 'target_date', 'target_percent',
		'note', 'actions',
	];
	public currentDate: any = moment();
	public filters: any = {};
	public selectedTabIndex: number = 0;
	public footerRow: any = { amount: 0, vat: 0, total: 0 };
	public filteredPO: Array<any> = [];
	public filteredVendor: Array<any> = [];
	public filteredStatus: Array<any> = [];
	public PAYMENT_STATUS: any = PAYMENT_STATUS;
	public PAYMENT_APPROVE_STATUS: any = PAYMENT_APPROVE_STATUS;
	public PLAN_STATUS: any = PLAN_STATUS;
	public QUOTATION_STATUS: any = QUOTATION_STATUS;
	public PURCHASE_ORDER_STATUS: any = PURCHASE_ORDER_STATUS;
	public activeFilter: string;

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {Router} router
	* @param {ActivatedRoute} route
	* @param {ProjectService} projectService
	* @param {ProjectPaymentService} projectPaymentService
	* @param {ProjectPaymentPlanService} projectPaymentPlanService
	*/
	constructor(
		public injector					: Injector,
		public dialog					: MatDialog,
		public snackBarService			: SnackBarService,
		public translateService			: TranslateService,
		public excelService				: ExcelService,
		public router					: Router,
		public route					: ActivatedRoute,
		public projectService			: ProjectService,
		public projectPaymentService	: ProjectPaymentService,
		public projectPaymentPlanService: ProjectPaymentPlanService
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

		this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
			const value: any = data[sortHeaderId];
			return typeof value === "string" ? value.toLowerCase() : value;
		};

		this.paymentPlanDataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
			const value: any = data[sortHeaderId];
			return typeof value === "string" ? value.toLowerCase() : value;
		};

		if ( this.activePaymentId ) this.activePaymentId = this.activePaymentId * 1;

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
	}

	/**
	* Tab changed
	* @param {number} tabIndex
	* @return {void}
	*/
	public tabChanged( tabIndex: number ) {
		switch ( tabIndex ) {
			case 0:
				( !this.dataSource.data || !this.dataSource.data.length )
					&& this.getList();
				return;
			case 1:
				( !this.paymentPlanDataSource.data || !this.paymentPlanDataSource.data.length )
					&& this.getListPlan();
				return;
		}
	}

	/**
	* Get project payments plans
	* @return {void}
	*/
	public getListPlan() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectPaymentPlanService
		.getAll( this.projectId )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			this.paymentPlanDataSource.sort = this.paymentPlanSort;
			this.paymentPlanDataSource.data = result;
		} );

		this.getProjectDetail();
	}

	/**
	* Delete project payment plan
	* @param {any} projectPaymentPlan - Project payment plan data need delete
	* @return {void}
	*/
	public deleteProjectPaymentPlan( projectPaymentPlan: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DELETE_PAYMENT_PLAN' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DELETE_PAYMENT_PLAN_CONFIRMATION', projectPaymentPlan ),
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

			this.projectPaymentPlanService
			.delete( projectPaymentPlan.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_PAYMENT_PLAN_FAIL', projectPaymentPlan );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_PAYMENT_PLAN_SUCCESS', projectPaymentPlan );

				this.getListPlan();
			} );
		} );
	}

	/**
	* Open dialog project payment plan to create/update
	* @param {any} projectPaymentPlan - Project payment plan data need create/update
	* @return {void}
	*/
	public openDialogProjectPaymentPlan( projectPaymentPlan?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogProjectPaymentPlanComponent,
			{
				width		: '650px',
				data: {
					...projectPaymentPlan,
					project_id: this.projectId,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getListPlan();
		} );
	}

	/**
	* Confirm update plan project
	* @param {string} planStatus
	* @return {void}
	*/
	public confirmUpdatePlanProject( planStatus: string ) {
		const updateData: any = {};
		let confirmation: string;

		if ( planStatus === 'waiting_approval' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.SUBMIT_PLAN_CONFIRMATION',
				this.project
			);
			updateData.payment_plan_status = PLAN_STATUS.WAITING_APPROVAL;
		}

		if ( planStatus === 'approve' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.APPROVE_PLAN_CONFIRMATION',
				this.project
			);
			updateData.payment_plan_status = PLAN_STATUS.APPROVED;
		}

		if ( planStatus === 'cancel' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.CANCEL_PLAN_CONFIRMATION',
				this.project
			);
			updateData.payment_plan_status = PLAN_STATUS.CANCELLED;
		}

		if ( planStatus === 'reject' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.REJECT_PLAN_CONFIRMATION',
				this.project
			);
			updateData.payment_plan_status = PLAN_STATUS.REJECTED;
		}

		this.updatePlanStatus( updateData, confirmation );
	}

	/**
	* Update project plan status
	* @param {any} data
	* @param {string} confirmation
	* @return {void}
	*/
	public updatePlanStatus( data: any, confirmation: string ) {
		const dialogData: any = {
			project	: this.project,
			status	: data.payment_plan_status,
			type	: 'payment',
			confirmation,
		};

		dialogData.comment = this.project.payment_plan_comment;

		const dialogRef: any = this.dialog.open(
			DialogPlanApproverComponent,
			{
				width	: '400px',
				data	: dialogData,
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			this.getListPlan();
		} );
	}

	/**
	* Get projects
	* @return {void}
	*/
	public getProjectDetail() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectService
		.getOne( this.projectId, 'project_info' )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.project.payment_plan_comment = result.payment_plan_comment;
			this.project.payment_plan_status = result.payment_plan_status;
			this.project.payment_plan_approver = result.payment_plan_approver;
			this.project.payment_plan_status_name = this.planStatus[ result.payment_plan_status ];

			this.loaded = true;
		} );
	}

	/**
	* Get project bills
	* @return {void}
	*/
	public getList() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectPaymentService
		.getAll( 'payable', this.projectId )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;

			this.footerRow = { amount: 0, vat: 0, total: 0 };

			const _filteredPO: any = {};
			const _filteredVendor: any = {};
			const _filteredStatus: any = {};
			const statusIds: Array<number> = [];

			_.each( result, ( item: any ) => {
				this.getPayDateAndCountDay( item );

				item.paid = item.approve_status === PAYMENT_APPROVE_STATUS.APPROVED ? +item.total_real : +item.total || 0;
				item.paid_vat = item.approve_status === PAYMENT_APPROVE_STATUS.APPROVED ? +item.total_vat_real : +item.total_vat || 0;

				item.is_procurement_approved = !!_.findWhere(
					item.project_payment_approvers,
					{ role_key: 'PROCUREMENT_MANAGER', status: PAYMENT_APPROVE_STATUS.APPROVED }
				);

				item.planed = item.is_procurement_approved ? +item.total_real : +item.total || 0;
				item.planed_vat = item.is_procurement_approved ? +item.total_vat_real : +item.total_vat || 0;
				item.planed_with_vat = item.planed + item.planed_vat;

				item.all_real = +item.total_real || 0;
				item.all_vat_real = +item.total_vat_real || 0;

				item.po_name = item.project_purchase_order && item.project_purchase_order.id
					? 'PO' + NumberService.padNumberFormatter( item.project_purchase_order.id, 4 )
					: null;

				!_filteredPO[ item.po_name ] && ( _filteredPO[ item.po_name ] = { id: item.po_name, po_name: item.po_name } );
				!_filteredVendor[ item.vendor_name ]
					&& ( _filteredVendor[ item.vendor_name ] = { id: item.vendor_name, vendor_name: item.vendor_name } );
				item.status_name
					&& item.status_name.id >= 0
					&& !_filteredStatus[ item.status_name.id ]
					&& (
						statusIds.push( item.status_name.id ),
						_filteredStatus[ item.status_name.id ] = this.payableStatus[ item.status_name.id ]
					);

				item.is_disabled = item.project_purchase_order
					&& item.project_purchase_order.vendor
					&& item.project_purchase_order.vendor.is_disabled;

				this.footerRow.amount += +item.planed;
				this.footerRow.vat += +item.planed_vat;

				// Check is freezed
				item.is_freezed = item.project_purchase_order
					&& item.project_purchase_order.status === PURCHASE_ORDER_STATUS.FREEZED;

				if ( item.invoices && item.invoices.length ) item.invoice = item.invoices.slice( -1 ).pop();
				if ( item.payment_orders && item.payment_orders.length ) item.payment_order = item.payment_orders.slice( -1 ).pop();

				item.total_procedures = item.procedures.length;
				item.confirmed_procedures = _.filter(
					item.procedures,
					( procedure: any ) => procedure.status === PROCEDURE_STATUS.CONFIRMED
				).length;

				this.arrangeStatusByRole( item );

				item.approvers_process = {
					count	: 0,
					is_done	: false,
					waiting	: 0,
					approved: 0,
					rejected: 0,
				};

				if ( item.approve_status === PAYMENT_APPROVE_STATUS.PROCESSING
					|| item.approve_status === PAYMENT_APPROVE_STATUS.CANCELLED
					|| item.approve_status === PAYMENT_APPROVE_STATUS.APPROVED ) {
					item.approvers_process.is_done = true;
					return;
				}

				_.each( item.project_payment_approvers, ( approver: any ) => {
					item.approvers_process.count++;

					if ( approver.status === PAYMENT_APPROVE_STATUS.WAITING_APPROVAL ) {
						item.approvers_process.waiting++;
					}
					if ( approver.status === PAYMENT_APPROVE_STATUS.APPROVED ) {
						item.approvers_process.approved++;
					}
					if ( approver.status === PAYMENT_APPROVE_STATUS.REJECTED ) {
						item.approvers_process.rejected++;
					}
				} );

				if ( item.approvers_process.waiting === item.approvers_process.count
					|| item.approvers_process.rejected === item.approvers_process.count ) {
					item.approvers_process.is_done = true;
				}
			});

			this.filteredPO = _.values( _filteredPO );
			this.filteredVendor = _.values( _filteredVendor );
			this.filteredStatus = _.values( _filteredStatus );

			this.filters.po_name = _.map( _filteredPO, 'po_name' );
			this.filters.vendor_name = _.map( _filteredVendor, 'vendor_name' );
			this.filters[ 'status_name.id' ] = _.uniq( statusIds );

			this.footerRow.total += this.footerRow.amount + this.footerRow.vat;

			this.dataSource.sort = this.paymentSort;
			this.dataSource.data = this.customSortDataSource( result );

			if ( ( this.isCFO || this.isProcurementManager ) && this.activePaymentId ) {
				const projectPayment: any = _.findWhere( result, { id: this.activePaymentId } );

				if ( projectPayment ) {
					if ( projectPayment.is_freezed ) return;

					( projectPayment.status !== PAYMENT_STATUS.PAID ) && this.openDialog( projectPayment );
				}
			}
		} );
	}

	/**
	* Arrange status by role
	* @param {any} payment
	* @return {array}
	*/
	public arrangeStatusByRole( payment: any ) {
		switch ( payment.status_name.key ) {
			case 'WAITING':
				if ( this.isLiabilitiesAccountant ) {
					payment.status_name.priority = 1;
				}
				break;
			case 'CONFIRMED':
				if ( this.isLiabilitiesAccountant ) {
					payment.status_name.priority = 3;
				}
				break;
		}

		const decision: any = _.findWhere( payment.project_payment_approvers, { role_key: this.account.role_key } );

		switch ( payment.approve_status_name.key ) {
			case 'PROCESSING':
				if ( this.isCFO || this.isLiabilitiesAccountant
					|| this.isProcurementManager || this.isGeneralAccountant ) {
					payment.approve_status_name.priority = 0;
				}
				break;
			case 'WAITING_APPROVAL':
				if ( this.isLiabilitiesAccountant ) {
					payment.approve_status_name.priority = 1;
				}

				if ( this.isProcurementManager || this.isGeneralAccountant || this.isCFO ) {
					payment.approve_status_name.priority = 3;

					if ( decision
						&& decision.status !== PAYMENT_APPROVE_STATUS.WAITING_APPROVAL ) {
						payment.approve_status_name.priority = 1;
					}
				}
				break;
			case 'APPROVED':
				if ( this.isLiabilitiesAccountant ) {
					payment.approve_status_name.priority = 3;
				}

				if ( this.isCFO || this.isProcurementManager || this.isGeneralAccountant ) {
					payment.approve_status_name.priority = 1;
				}
				break;
			case 'CANCELLED':
				if ( this.isCFO || this.isLiabilitiesAccountant
					|| this.isProcurementManager || this.isGeneralAccountant ) {
					payment.approve_status_name.priority = 0;
				}
				break;
			case 'REJECTED':
				if ( this.isCFO || this.isLiabilitiesAccountant
					|| this.isProcurementManager || this.isGeneralAccountant ) {
					payment.approve_status_name.priority = 2;
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
			|| b.approve_status_name.priority - a.approve_status_name.priority
			|| a.count_day - b.count_day );

		return data;
	}

	/**
	* Open dialog project payment to create/update
	* @param {any} projectPayment - Project payment data need create/update
	* @return {void}
	*/
	public openDialog( projectPayment?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogProjectPaymentComponent,
			{
				width		: '750px',
				panelClass	: [ 'dialog-project-bill', 'mat-dialog' ],
				data: {
					...projectPayment,
					project_id	: this.projectId,
					approvers	: projectPayment.project_payment_approvers,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.activePaymentId = null;
			this.getList();
		} );
	}

	/**
	* Open dialog project payment invoice history
	* @param {any} projectPayment - Project payment data need create/update
	* @return {void}
	*/
	public openDialogInvoiceHistory( projectPayment: any ) {
		this.dialog.open(
			DialogProjectPaymentInvoiceComponent,
			{
				width: '650px',
				data: {
					...projectPayment,
					project_id	: this.project.id,
					project_name: this.project.name,
				},
			}
		);
	}

	/**
	* Open dialog project payment order history
	* @param {any} projectPayment - Project payment data need create/update
	* @return {void}
	*/
	public openDialogOrderHistory( projectPayment: any ) {
		this.dialog.open(
			DialogProjectPaymentOrderComponent,
			{
				width: '650px',
				data: {
					...projectPayment,
					project_id	: this.project.id,
					project_name: this.project.name,
				},
			}
		);
	}

	/**
	* Open dialog project payment approver
	* @param {any} projectPayment - Project payment data need create/update
	* @return {void}
	*/
	public openDialogPaymentApprover( projectPayment: any ) {
		const dialogRef: any = this.dialog.open(
			DialogProjectPaymentApproverComponent,
			{
				width: '400px',
				data: {
					id			: projectPayment.id,
					name		: projectPayment.name,
					approvers	: projectPayment.project_payment_approvers,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.activePaymentId = null;
			this.getList();

			this.refreshProjectDetail.emit();
		} );
	}

	/**
	* Confirm update project payment approve status
	* @param {any} payment
	* @param {string} paymentStatus
	* @return {void}
	*/
	public confirmUpdateApproveStatus( payment: any, paymentStatus: string ) {
		const updateData: any = {};
		let title: string;
		let confirmation: string;

		if ( paymentStatus === 'waiting_approval' ) {
			title = 'FINANCE.PROJECT.TITLES.SUBMIT_PAYMENT_STATUS';
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.SUBMIT_PROJECT_PAYMENT_CONFIRMATION',
				payment
			);
			updateData.status = PAYMENT_APPROVE_STATUS.WAITING_APPROVAL;
		}

		if ( paymentStatus === 'cancel' ) {
			title = 'FINANCE.PROJECT.TITLES.CANCEL_PAYMENT_STATUS';
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.CANCEL_PROJECT_PAYMENT_CONFIRMATION',
				payment
			);
			updateData.status = PAYMENT_APPROVE_STATUS.CANCELLED;
		}

		this.updateApproveStatus( payment, updateData, title, confirmation );
	}

	/**
	* Update project payment status
	* @param {any} payment
	* @param {any} data
	* @param {string} title
	* @param {string} confirmation
	* @return {void}
	*/
	public updateApproveStatus(
		payment: any, data: any,
		title: string, confirmation: string
		) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( title ),
					content	: confirmation,
					actions: {
						yes: { color: 'accent' },
					},
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			this.projectPaymentService
			.updateApproveStatus( payment.id, data )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_PAYMENT_FAIL', this.project );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_PAYMENT_SUCCESS', this.project );

				this.getList();
			} );
		} );
	}

	/**
	* Delete project bill
	* @param {any} projectPayment - Project bill data need delete
	* @return {void}
	*/
	public delete( projectPayment: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DELETE_PAYMENT' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DELETE_PAYMENT_CONFIRMATION', projectPayment ),
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

			this.projectPaymentService
			.delete( projectPayment.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_BILL_FAIL', projectPayment );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_BILL_SUCCESS', projectPayment );

				this.getList();
			} );
		} );
	}

	/**
	* Back to projects list
	* @return {void}
	*/
	public backToList() {
		this.router.navigate( [ 'finance/project' ] );
	}

	/**
	 * Download invoice
	 * @return {void}
	 */
	public exportExcel() {
		const _this = this;
		this.projectService
			.getOne( this.projectId, 'project_info' )
			.subscribe( ( resultPaymentPlanStatus: any ) => {
				const payment_plan_status = resultPaymentPlanStatus.payment_plan_status;
				const payment_plan_approver = resultPaymentPlanStatus.payment_plan_approver;
				const payment_plan_status_name = _this.planStatus[ resultPaymentPlanStatus.payment_plan_status ];
				const titles = ['Payments List', 'Payments Plan List'];
				const sheetNames = ['Payments', 'Payments Plan'];
				const fileName = `${TableUtil.slug(_this.project.name || '')}_Payments`;
				let bgColor = '';
				if (payment_plan_status === _this.PLAN_STATUS.PROCESSING) {
					bgColor = '2196F3';
				} else if (
					payment_plan_status === _this.PLAN_STATUS.WAITING_APPROVAL ||
					payment_plan_status === _this.PLAN_STATUS.REJECTED ||
					payment_plan_status === _this.PLAN_STATUS.CANCELLED
				) {
					bgColor = 'FD8631';
				} else {
					bgColor = '38AE00';
				}
				const infoData = {
					data: [
						{
							title: _this.translateService.instant('FINANCE.PROJECT.LABELS.APPROVER'),
							value: (payment_plan_approver && payment_plan_approver.full_name)
								? payment_plan_approver.full_name
								: 'N/A'
						},
						{
							title: _this.translateService.instant('FINANCE.PROJECT.LABELS.PAYMENT_PLAN_STATUS'),
							value: (payment_plan_status_name && payment_plan_status_name.name)
								? _this.translateService.instant(payment_plan_status_name.name)
								: 'N/A',
							bgColor:  (payment_plan_status_name && payment_plan_status_name.color)
								? bgColor
								: ''
						}
					],
					cols: 2,
					applySheetIndex: 1
				};
				const exportDatas: any[] = [];
				const extraDatas: any[] = [];
				const headerSettings: any[] = [
					{
						header: [
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PO'),
							_this.translateService.instant('FINANCE.VENDOR.ATTRIBUTES.VENDOR'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.AMOUNT'),
							_this.translateService.instant('GENERAL.ATTRIBUTES.VAT'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.INVOICE_DATE'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PAY_DATE'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PROCEDURE'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PAYMENT_STATUS'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.APPROVE_STATUS'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.INVOICE'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PAYMENT_ORDER')
						],
						fgColor: 'ffffff',
						bgColor: '00245A',
						noData: _this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'payment'})
					},
					{
						header: [
							_this.translateService.instant('GENERAL.ATTRIBUTES.NAME'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TARGET_DATE'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TARGET_PERCENT'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.NOTE')
						],
						fgColor: 'ffffff',
						bgColor: '00245A',
						noData: _this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'payment plan'})
					}
				];
				const exportDataPayments: any[] = [];
				this.dataSource.data.forEach((item: any) => {
					const dataItemPayments: any[] = [];
					dataItemPayments.push(item.po_name || 'N/A');
					dataItemPayments.push(item.vendor_name || 'N/A');
					dataItemPayments.push(TableUtil.getNumberFormatForExcel(item.planed || 0));
					dataItemPayments.push(TableUtil.getNumberFormatForExcel(item.planed_vat || 0));
					dataItemPayments.push(TableUtil.getNumberFormatForExcel(item.planed_with_vat || 0));
					dataItemPayments.push(item.invoice_date ? TableUtil.getDateFormatForExcel(new Date(item.invoice_date) ): '');

					const pay_date: any = {
						richText: [
							{font: {size: 12},text: (item.pay_date ? TableUtil.getDateFormatForExcel(new Date(item.pay_date)) : '')}
						]
					};
					if (item.pay_date) {
						pay_date.richText.push({
							font: {size: 12},text: '\n('
						});
						pay_date.richText.push({
							font: {size: 12, color: {argb: (item.count_day && item.count_day >= 0) ? '38AE00' : 'FF3636'}},
							text: (((item.count_day || 0) < 0 ? item.count_day : TableUtil.pad(item.count_day || 0, 2))) + ' ' + this.translateService.instant('GENERAL.LABELS.DAYS').toLowerCase()
						});
						pay_date.richText.push({
							font: {size: 12},text: ')'
						});
					}
					dataItemPayments.push(pay_date);
					dataItemPayments.push( item.total_procedures ? ( item.confirmed_procedures + '/' + item.total_procedures ) : 0);
					const status = (item.status_name && item.status_name.name) ? {value: this.translateService.instant(item.status_name.name), fgColor: item.status_name.color ? item.status_name.color.replace('#', '') : 'FF0000'} : {value: '', fgColor: 'FF0000'};
					dataItemPayments.push(status);
					const approve_status = (item.approve_status_name && item.approve_status_name.name) ? {value: this.translateService.instant(item.approve_status_name.name), fgColor: item.approve_status_name.color ? item.approve_status_name.color.replace('#', '') : 'FF0000'} : {value: '', fgColor: 'FF0000'};
					dataItemPayments.push(approve_status);
					dataItemPayments.push(item.invoice ? 'Has invoice' : '--');
					dataItemPayments.push(item.payment_order ? 'Has payment order' : '--');
					exportDataPayments.push(dataItemPayments);
				});
				const extraDataPayments = [
					{
						title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.AMOUNT'),
						value: TableUtil.getNumberFormatForExcel(this.footerRow.amount || 0),
						fgColors: ['38AE00', 'FD8631']
					},
					{
						title: this.translateService.instant('GENERAL.ATTRIBUTES.VAT'),
						value: TableUtil.getNumberFormatForExcel(this.footerRow.vat || 0),
						fgColors: ['38AE00', 'FD8631']
					},
					{
						title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'),
						value: TableUtil.getNumberFormatForExcel(this.footerRow.total || 0),
						fgColors: ['38AE00', 'FD8631']
					}
				];
				_this.projectPaymentPlanService
					.getAll( _this.projectId )
					.subscribe( ( result: any ) => {
						const exportDataPaymentsPlan: any[] = [];
						result = result || [];
						result.forEach((item: any) => {
							const dataItemPaymentsPlan: any[] = [];
							dataItemPaymentsPlan.push(item.name || 'N/A');
							dataItemPaymentsPlan.push(item.target_date ? TableUtil.getDateFormatForExcel(new Date(item.target_date)) : '');
							dataItemPaymentsPlan.push(TableUtil.getNumberFormatForExcel(item.target_percent || 0) + '%');
							dataItemPaymentsPlan.push(item.note || 'N/A');
							exportDataPaymentsPlan.push(dataItemPaymentsPlan);
						});
						const extraDataPaymentsPlan = [];
						exportDatas.push(exportDataPayments);
						extraDatas.push(extraDataPayments);
						exportDatas.push(exportDataPaymentsPlan);
						extraDatas.push(extraDataPaymentsPlan);
						_this.excelService.exportArraysToExcel(
							exportDatas,
							titles,
							headerSettings,
							sheetNames,
							fileName,
							extraDatas,
							infoData
						);
					} );
			} );
	}

	/**
	* Download payment order
	* @param {any} key - Key attachment to download
	* @param {any} url - Url attachment to download
	* @return {void}
	*/
	public downloadPaymentOrder( key: string, url: string ) {
		const data: any = { key, url };

		this.projectPaymentService
		.downloadPaymentOrder( data )
		.subscribe( ( result: any ) => {
			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DOWNLOAD_PAYMENT_ORDER_FAIL' );
				return;
			}

			const win: any = window.open( result.data, '_blank' );
			win.focus();
		} );
	}

	/**
	* Show payment detail
	* @param {any} item - Vendor cost item data
	* @return {void}
	*/
	public showPaymentDetail( item: any ) {
		item.show_detail_row = !item.show_detail_row;
	}

	/**
	* Render date range
	* @param {any} date
	* @return {string}
	*/
	public renderDateRange( date: any ) {
		if ( !date ) return '';

		date = date.isValid && date.isValid() ? date : moment( date );

		return date.clone().startOf( 'w' ).date() + ' - ' + date.clone().endOf( 'w' ).format( 'DD/MM/YYYY' );
	}

	/**
	* Custom filter
	* @return {void}
	*/
	public customFilter() {
		this.applyFilter();

		const payableTotal: any = { amount: 0, vat: 0, total: 0 };
		const _filteredPO: any = {};
		const _filteredVendor: any = {};
		const _filteredStatus: any = {};

		_.each( this.dataSource.filteredData, ( item: any ) => {
			payableTotal.amount += item.planed;
			payableTotal.vat += item.planed_vat;

			!_filteredPO[ item.po_name ] && ( _filteredPO[ item.po_name ] = { id: item.po_name, po_name: item.po_name } );
			!_filteredVendor[ item.vendor_name ]
				&& ( _filteredVendor[ item.vendor_name ] = { id: item.vendor_name, vendor_name: item.vendor_name } );
			item.status_name
				&& item.status_name.id >= 0
				&& !_filteredStatus[ item.status_name.id ]
				&& ( _filteredStatus[ item.status_name.id ] = this.payableStatus[ item.status_name.id ] );
		} );

		this.activeFilter !== 'po_name' && ( this.filteredPO = _.values( _filteredPO ) );
		this.activeFilter !== 'vendor_name' && ( this.filteredVendor = _.values( _filteredVendor ) );
		this.activeFilter !== 'status_name' && ( this.filteredStatus = _.values( _filteredStatus ) );

		payableTotal.total = payableTotal.amount + payableTotal.vat;

		this.footerRow = payableTotal;
	}

}
