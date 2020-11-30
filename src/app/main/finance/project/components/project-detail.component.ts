import {
	OnInit, OnDestroy, ViewEncapsulation,
	Component, Injector
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import _ from 'underscore';

import { PageService } from '@core';
import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { DialogProjectApproverComponent } from '@finance/project/components/dialog-project-approver.component';
import { ProjectService } from '@finance/project/services/project.service';
import { QUOTATION_STATUS, PROJECT_STATUS } from '@resources';

@Component({
	selector		: 'project-detail',
	templateUrl		: '../templates/project-detail.pug',
	styleUrls		: [ '../styles/project-detail.scss' ],
	encapsulation	: ViewEncapsulation.None,
})
export class ProjectDetailComponent extends ProjectBaseComponent implements OnInit, OnDestroy {

	public canSubmitProject: boolean;
	public canApproveProject: boolean;
	public approverDecision: any = {};
	public queryParams: any = {};
	public waitingAction: any = {};
	public rootTab: string = 'overview';
	public QUOTATION_STATUS: any = QUOTATION_STATUS;
	public PROJECT_STATUS: any = PROJECT_STATUS;
	public selectedTabIndex: number = 0;
	public approverStatus: any = {
		pm					: {},
		sale				: {},
		procurement_manager	: {},
	};

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {Router} router
	* @param {ActivatedRoute} route
	* @param {ProjectService} projectService
	* @param {PageService} pageService
	*/
	constructor(
		public injector			: Injector,
		public dialog			: MatDialog,
		public snackBarService	: SnackBarService,
		public translateService	: TranslateService,
		public router			: Router,
		public route			: ActivatedRoute,
		public projectService	: ProjectService,
		public pageService		: PageService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.sub = [];

		this.sub[ 0 ] = this.route.params.subscribe( ( params: any ) => {
			this.projectId = +params.id;
			this.sub[ 1 ] = this.route.queryParams.subscribe( ( queryParams: any ) => {
				this.queryParams = queryParams;

				if ( queryParams.tab && _.contains(
					[
						'quotation', 'cost',
						'receivables', 'payables',
					],
					queryParams.tab
				) ) {
					this.rootTab = queryParams.tab;
				}

				this.initData();
			});
		});
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
		this.getProjectDetail();
	}

	/**
	* Back to projects list
	* @return {void}
	*/
	public backToList() {
		this.router.navigate( [ 'finance/project' ] );
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
			this.pageService.setTitle(
				this.translateService.instant( 'FINANCE.PROJECT.LABELS.PROJECT' )
					+ ': '
					+ result.name
			);

			const project: any = {
				...result,
				project_status_name		: _.findWhere( this.projectStatus, { id: result.project_status || 0 } ),
				quotation_status_name	: _.findWhere( this.quotationStatus, { id: result.quotation_status || 0 } ),
			};

			if ( this.isConstruction && this.rootTab !== 'purchasing' ) {
				this.rootTab = 'purchasing';
			}

			this.approverDecision = ( this.isPM || this.isSale || this.isProcurementManager )
				&& _.findWhere( project.project_approvers, { user_id: this.account.id } );

			this.canApproveProject = _.contains( [ QUOTATION_STATUS.WAITING_APPROVAL, QUOTATION_STATUS.REJECTED ], project.quotation_status );

			this.loaded = true;
			this.project = project;

			_.each( result.project_approvers, ( item: any ) => {
				if ( item.user_id === this.project.manage_by ) {
					this.approverStatus.pm = item;
				}

				if ( item.user_id === this.project.sale_by ) {
					this.approverStatus.sale = item;
				}

				if ( item.user_id !== this.project.manage_by && item.user_id !== this.project.sale_by ) {
					this.approverStatus.procurement_manager = item;
					this.project.procurement_manager = item.user;
				}
			} );

			if ( this.isCEO || this.isPM || this.isSale
				|| this.isProcurementManager || this.isQS || this.isPurchasing
				|| this.isCFO || this.isLiabilitiesAccountant || this.isGeneralAccountant ) {
				this.getProjectWaitingAction();
			}
		} );
	}

	/**
	* Get project waiting action
	* @return {void}
	*/
	public getProjectWaitingAction() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectService
		.getWaitingAction( this.projectId )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.waitingAction = result;
			this.loaded = true;
		} );
	}

	/**
	* Confirm update project
	* @param {string} quotationStatus
	* @return {void}
	*/
	public confirmUpdateProject( quotationStatus: string ) {
		const updateData: any = {};
		let confirmation: string;

		if ( quotationStatus === 'waiting_approval' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.SUBMIT_PROJECT_CONFIRMATION',
				this.project
			);
			updateData.quotation_status = QUOTATION_STATUS.WAITING_APPROVAL;
		}

		if ( quotationStatus === 'approve' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.APPROVE_PROJECT_CONFIRMATION',
				this.project
			);
			updateData.quotation_status = QUOTATION_STATUS.APPROVED;
		}

		if ( quotationStatus === 'cancel' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.CANCEL_PROJECT_CONFIRMATION',
				this.project
			);
			updateData.quotation_status = QUOTATION_STATUS.CANCELLED;
		}

		if ( quotationStatus === 'reject' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.REJECT_PROJECT_CONFIRMATION',
				this.project
			);
			updateData.quotation_status = QUOTATION_STATUS.REJECTED;
		}

		this.updateQuotationStatus( updateData, confirmation );
	}

	/**
	* Can add sheet
	* @return {booelean}
	*/
	get canAddSheet(): boolean {
		return this.isQS && ( this.project.quotation_status === QUOTATION_STATUS.PROCESSING
			|| this.project.quotation_status === QUOTATION_STATUS.CANCELLED );
	}

	/**
	* Can add cost
	* @return {booelean}
	*/
	get canAddCost(): boolean {
		return this.isQS && ( this.project.quotation_status === QUOTATION_STATUS.PROCESSING
			|| this.project.quotation_status === QUOTATION_STATUS.CANCELLED );
	}

	/**
	* Check sheet approval
	* @param {array} sheets
	* @return {void}
	*/
	public checkSheetApproval( sheets: Array<any> ) {
		if ( !sheets || !sheets.length ) {
			this.canSubmitProject = false;
			return;
		}

		this.canSubmitProject = true;
	}

	/**
	* Update project quotation status
	* @param {any} data
	* @param {string} confirmation
	* @return {void}
	*/
	public updateQuotationStatus( data: any, confirmation: string ) {
		const dialogData: any = {
			project			: this.project,
			quotation_status: data.quotation_status,
			confirmation,
		};

		if ( this.isPM ) dialogData.comment = this.approverStatus.pm.comment;
		if ( this.isSale ) dialogData.comment = this.approverStatus.sale.comment;
		if ( this.isProcurementManager ) dialogData.comment = this.approverStatus.procurement_manager.comment;

		const dialogRef: any = this.dialog.open(
			DialogProjectApproverComponent,
			{
				width	: '400px',
				data	: dialogData,
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			this.getProjectDetail();
		} );
	}

	/**
	* Tab changed
	* @param {string} tab
	* @return {void}
	*/
	public rootTabChanged( tab: string ) {
		if ( !tab || !tab.length || this.rootTab === tab ) return;

		if ( ( tab === 'receivables' || tab === 'payables' ) && ( this.queryParams.bill_id || this.queryParams.payment_id ) ) {
			this.router.navigate( [ 'finance/project/detail/' + this.projectId ], { queryParams: { tab } } );
			return;
		}

		this.rootTab = tab;
	}

	/**
	* Refresh project detail
	* @return {void}
	*/
	public refreshProjectDetail() {
		this.getProjectDetail();
	}

}
