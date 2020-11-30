import {
	OnInit, OnDestroy, Component,
	Injector, Input, ViewChild
} from '@angular/core';

import { MatDialog } from '@angular/material';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import _ from 'underscore';

import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { DialogConfirmComponent } from '@core';
import { DialogUploadFileComponent } from './dialog-upload-file.component';
import { DialogProjectCostItemComponent } from './dialog-project-cost-item.component';
import { ProjectCostItemService } from '@finance/project/services/project-cost-item.service';
import { ProjectPaymentService } from '@finance/project/services/project-payment.service';
import {PROJECT_STATUS, QUOTATION_STATUS} from '@resources';
import {MatSort} from "@angular/material/sort";
import {TableUtil} from "@app/utils/tableUtils";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
	selector	: 'project-cost',
	templateUrl	: '../templates/project-cost.pug',
	styleUrls	: [ '../styles/project-cost.scss' ],
})
export class ProjectCostComponent extends ProjectBaseComponent implements OnInit, OnDestroy {

	@Input() public project: any;
	@Input() public projectId: number;
	@Input() public loaded: boolean;
	@Input() public canAddCost: boolean;
	@ViewChild(MatSort) sort: MatSort;

	public isUploading: boolean;
	public uploadedFile: any;
	public costItems: Array<any> = [];
	public projectStatus: any = PROJECT_STATUS;
	public footerRow: any = { sub_total: 0, vo_total: 0 };
	public displayedColumns: Array<string> = [
		'no', 'name', 'vendor',
		'unit', 'amount', 'price',
		'total', 'note', 'actions',
	];

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {Router} router
	* @param {ActivatedRoute} route
	* @param {ProjectCostItemService} projectCostItemService
	* @param {ProjectPaymentService} projectPaymentService
	*/
	constructor(
		public injector					: Injector,
		public dialog					: MatDialog,
		public snackBarService			: SnackBarService,
		public translateService			: TranslateService,
		public excelService     		: ExcelService,
		public router					: Router,
		public route					: ActivatedRoute,
		public projectCostItemService	: ProjectCostItemService,
		public projectPaymentService	: ProjectPaymentService
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
	* Back to projects list
	* @return {void}
	*/
	public backToList() {
		this.router.navigate( [ 'finance/project' ] );
	}

	/**
	* Open dialog project cost item to create/update
	* @param {any} data - Project line item data need create/update
	* @return {void}
	*/
	public openDialogProjectCostItem( data: any = {} ) {
		const vendor: any = data.vendor;
		const dialogComponent: any = DialogProjectCostItemComponent;
		const dialogData: any = {
			project_id				: this.projectId,
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

			this.getList();
		} );
	}

	/**
	* Get project bills
	* @return {void}
	*/
	public getList() {
		this.setProcessing( true );
		this.loaded = false;
		this.costItems = [];

		this.projectCostItemService
		.getAll( this.projectId )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			this.footerRow.sub_total = 0;
			this.footerRow.vo_total = 0;
			this.footerRow.totalTest = 0;
			result = _.map( result, ( item: any ) => {
				if ( item.bk_price !== null ) item.total = item.bk_amount * item.bk_price;
				else item.total = item.price * item.amount;

				if ( item.vo_add_id !== null || item.vo_delete_id !== null ) {
					this.footerRow.vo_total += item.vo_add_id !== null ? item.total : -item.total;
				} else {
					this.footerRow.sub_total += item.total;
				}
				return item;
			} );

			this.costItems = result;
			this.dataSource.sort = this.sort;
			this.dataSource.data = result;
		} );
	}

	/**
	* canModifyVendor
	* @return {booelean}
	*/
	get canModifyCost(): boolean {
		return this.project.quotation_status !== QUOTATION_STATUS.APPROVED
		&& this.project.quotation_status !== QUOTATION_STATUS.WAITING_APPROVAL;
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

				this.getList();
			} );
		} );
	}

	public openDialogUploadFile() {
		const dialogRef: any = this.dialog.open(
			DialogUploadFileComponent,
			{
				width: '400px',
				data: {
					upload_file_destination	: 'cost',
					project_id				: this.projectId,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result || !result.file_location ) return;

			// in case of had duplicated sheet(s)
			if ( this.costItems.length ) {
				const _dialogRef: any = this.dialog.open(
					DialogConfirmComponent,
					{
						width: '400px',
						data: {
							title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.REPLACE_COST_ITEMS' ),
							content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.REPLACE_COST_ITEMS_CONFIRMATION' ),
							actions: {
								yes: {
									name: this.translateService.instant( 'FINANCE.PROJECT.LABELS.REPLACE' ),
									value: 'replace',
									color: 'warn',
								},
								other: {
									name: this.translateService.instant( 'FINANCE.PROJECT.LABELS.ADD_NEW' ),
									value: 'addnew',
									color: 'accent',
								},
							},
						},
					}
				);

				_dialogRef
				.afterClosed()
				.subscribe( ( _result: any ) => {
					if ( !_result ) return;
					this.upload( result.file_location, _result );
				} );
			} else {
				this.upload( result.file_location );
			}
		} );
	}

	/**
	* Upload
	* @param {File} fileLocation
	* @param {string} action
	* @return {void}
	*/
	public upload( fileLocation: File, action: string = 'addnew' ) {
		this.isUploading = true;
		this.loaded = false;

		this.projectCostItemService
		.upload( fileLocation, { project_id: this.projectId }, action )
		.subscribe( ( result: any ) => {
			this.isUploading = false;
			this.loaded = true;

			if ( !result || !result.status ) {
				this.uploadedFile = null;

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

			this.getList();
		} );
	}

	public exportExcel() {
		const headerSetting = {
			header: [
				this.translateService.instant('GENERAL.ATTRIBUTES.NAME'),
				this.translateService.instant('FINANCE.VENDOR.ATTRIBUTES.VENDOR'),
				this.translateService.instant('GENERAL.ATTRIBUTES.UNIT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.AMOUNT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PRICE'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.NOTE')
			],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'cost'}),
			fgColor: 'ffffff',
			bgColor: '00245A',
			widths: [50, 30, 15, 15, 20, 20, 50]
		};
		const title = 'Cost List';
		const sheetName = 'Costs';
		const fileName = `${TableUtil.slug(this.project.name || '')}_Cost`;
		const exportData: any[] = [];
		this.dataSource.data.forEach((item: any) => {
			const dataItem: any[] = [];
			dataItem.push(item.name || 'N/A');
			dataItem.push((item.vendor && item.vendor.short_name) ? item.vendor.short_name : 'N/A');
			dataItem.push(item.unit || 'N/A');
			dataItem.push(TableUtil.pad(Math.floor((item.bk_amount || item.amount || 0) + .5), 2));
			dataItem.push(TableUtil.getNumberFormatForExcel(item.bk_price || item.price || 0));
			dataItem.push(TableUtil.getNumberFormatForExcel(item.bk_total || item.total || 0));
			dataItem.push(item.note || '');
			exportData.push(dataItem);
		});
		const extraData = [
			{title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.SUBTOTAL'), value: TableUtil.getNumberFormatForExcel(this.footerRow.sub_total || 0), fgColors: ['FD8631', 'FD8631']},
			{title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.VO_TOTAL'), value: TableUtil.getNumberFormatForExcel(this.footerRow.vo_total || 0)},
			{title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'), value: TableUtil.getNumberFormatForExcel((this.footerRow.sub_total || 0) + (this.footerRow.vo_total || 0)), fgColors: ['38AE00', '38AE00']}
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
