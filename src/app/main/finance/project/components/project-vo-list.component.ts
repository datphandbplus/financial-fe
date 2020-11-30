import {
	OnInit, OnDestroy, Component,
	Injector, Input, Output, EventEmitter, ViewChild
} from '@angular/core';
import { DialogConfirmComponent } from '@core';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VOService } from '@finance/project/services/vo.service';
import { DialogVOComponent } from './dialog-vo.component';
import { MatDialog } from '@angular/material';
import _ from 'underscore';

import { ProjectBaseComponent } from '@finance/project/project-base.component';

import {
	PROJECT_VO_STATUS, COLORS, PROJECT_STATUS
} from '@resources';
import {MatSort} from "@angular/material/sort";
import {TableUtil} from "@app/utils/tableUtils";
import {ExcelService} from "@ext/lezo/services/excel.service";


@Component({
	selector	: 'project-vo-list',
	templateUrl	: '../templates/project-vo-list.pug',
})
export class ProjectVOListComponent extends ProjectBaseComponent implements OnInit, OnDestroy {

	@Input() public project: any;
	@Input() public projectId: number;
	@Input() public loaded: boolean;
	@ViewChild(MatSort) sort: MatSort;

	@Output() public onChooseVo: EventEmitter<number> = new EventEmitter<number>();

	public voList: Array<any> = [];
	public displayedColumns: Array<string> = [
		'vo', 'name', 'subtotal',
		'discount', 'total_wo_vat', 'vat',
		'total_w_vat','total_wo_cost_vat' ,'date', 'status',
		'actions',
	];
	public totalFooter: any = {};
	public canAdd: boolean = true;
	public PROJECT_VO_STATUS: any = PROJECT_VO_STATUS;
	public projectStatus: any = PROJECT_STATUS;
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
	* @param {VOService} voService
	*/
	constructor(
		public injector					: Injector,
		public dialog					: MatDialog,
		public snackBarService			: SnackBarService,
		public translateService			: TranslateService,
		public excelService     		: ExcelService,
		public router					: Router,
		public route					: ActivatedRoute,
		public voService				: VOService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
			const value: any = data[sortHeaderId];
			return typeof value === "string" ? value.toLowerCase() : value;
		};
		if ( this.isConstruction || this.isConstructionManager ) {
			this.displayedColumns.splice( 2, 5 );
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
	}

	/**
	* Get projects
	* @return {void}
	*/
	public getList() {
		this.setProcessing( true );
		this.loaded = false;

		this.voService
		.getAll( 'project', this.projectId )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;

			this.canAdd = this.isQS && !_.filter( result, ( item: any ) => item.status !== PROJECT_VO_STATUS.APPROVED ).length;

			this.totalFooter = {
				total_wo_vat: 0,
				vat			: 0,
				total_w_vat	: 0,
				total_wo_cost_vat: 0
			};
			result = _.map( result, ( item: any ) => {
				item.subtotal = 0;
				item.subCostTotal = 0;
				_.each( item.add_by, ( addedItem: any ) => {
					item.subtotal += addedItem.amount * addedItem.price;
				});
				_.each( item.delete_by, ( deletedItem: any ) => {
					item.subtotal -= deletedItem.amount * deletedItem.price;
				});
				_.each( item.add_cost_by, ( addedItem: any ) => {
					item.subCostTotal += addedItem.amount * addedItem.price;
				});
				_.each( item.delete_cost_by, ( deletedItem: any ) => {
					item.subCostTotal -= deletedItem.amount * deletedItem.price;
				});


				item.discount = ( item.discount_type === '$' ) ? item.discount_amount : item.subtotal * item.discount_amount / 100;

				item.discountCost = ( item.discount_type === '$' ) ? item.discount_amount : item.subCostTotal * item.discount_amount / 100;

				item.total_wo_vat = item.subtotal - item.discount;

				item.total_wo_cost_vat = item.subCostTotal - item.discountCost;

				item.vat = item.total_wo_vat * item.vat_percent / 100;

				item.total_w_vat = item.total_wo_vat + item.vat;

				item.status_name = _.findWhere( this.voStatus, { id: item.status });

				this.totalFooter.total_wo_vat += item.total_wo_vat;
				this.totalFooter.total_wo_cost_vat += item.total_wo_cost_vat;
				this.totalFooter.vat += item.vat;
				this.totalFooter.total_w_vat += item.total_w_vat;

				return item;
			});

			this.voList = result;
			this.dataSource.sort = this.sort;
			this.dataSource.data = result;
		} );
	}

	/**
	* Open dialog vo to create/update
	* @param {any} vo - vo data need create/update
	* @return {void}
	*/
	public openDialogVO( vo?: any ) {
		const dialogComponent: any = DialogVOComponent;

		const dialogRef: any = this.dialog.open(
			dialogComponent,
			{
				width: '450px',
				data: {
					project_id	: this.projectId,
					project_name: this.project.name,
					...vo,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			if ( !vo ) {
				this.onChooseVo.emit( result );
				return;
			}

			this.getList();
		} );
	}

	/**
	* Delete
	* @param {any} vo - data need delete
	* @return {void}
	*/
	public delete( vo: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DELETE_PROJECT_VO' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_VO_CONFIRMATION', vo ),
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
			.delete( vo.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_VO_FAIL', vo );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_VO_SUCCESS', vo );

				this.getList();
			} );
		} );
	}

	public exportExcel() {
		const headerSetting = {
			header: [
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.VO_CODE'),
				this.translateService.instant('GENERAL.ATTRIBUTES.NAME'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.SUBTOTAL'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.DISCOUNT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL_VO_EXCLUDED_VAT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.VO_VAT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL_VO_INCLUDED_VAT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL_VO_COST'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.CREATED_DATE'),
				this.translateService.instant('GENERAL.ATTRIBUTES.STATUS')
			],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'variation order'}),
			fgColor: 'ffffff',
			bgColor: '00245A'
		};
		const title = 'Variation Orders List';
		const sheetName = 'Variation Orders';
		const fileName = `${TableUtil.slug(this.project.name || '')}_Variation_Orders`;
		const exportData: any[] = [];
		this.dataSource.data.forEach((item: any) => {
			const dataItem: any[] = [];
			dataItem.push((item.id !== undefined && item.id !== null) ? ('VO' + TableUtil.pad(item.id, 4)) : 'N/A');
			dataItem.push(item.name || 'N/A');
			dataItem.push(TableUtil.getNumberFormatForExcel(item.subtotal || 0));
			dataItem.push(TableUtil.getNumberFormatForExcel(item.discount || 0));
			dataItem.push(TableUtil.getNumberFormatForExcel(item.total_wo_vat || 0));
			dataItem.push(TableUtil.getNumberFormatForExcel(item.vat || 0));
			dataItem.push(TableUtil.getNumberFormatForExcel(item.total_w_vat || 0));
			dataItem.push(TableUtil.getNumberFormatForExcel(item.total_wo_cost_vat || 0));
			dataItem.push(item.created_at ? TableUtil.getDateFormatForExcel(new Date(item.created_at)) : '');
			const status = (item.status_name && item.status_name.name) ? {value: this.translateService.instant(item.status_name.name), fgColor: item.status_name.color ? item.status_name.color.replace('#', '') : 'FF0000'} : {value: '', fgColor: 'FF0000'};
			dataItem.push(status);
			exportData.push(dataItem);
		});
		const extraData = [
			{title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL_VO_EXCLUDED_VAT'), value: TableUtil.getNumberFormatForExcel(this.totalFooter.total_wo_vat || 0), fgColors: ['38AE00', '38AE00']},
			{title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.VO_VAT'), value: TableUtil.getNumberFormatForExcel(this.totalFooter.vat || 0), fgColors: ['38AE00', '38AE00']},
			{title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL_VO_INCLUDED_VAT'), value: TableUtil.getNumberFormatForExcel(this.totalFooter.total_w_vat || 0), fgColors: ['38AE00', '38AE00']},
			{title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL_VO_COST'), value: TableUtil.getNumberFormatForExcel(this.totalFooter.total_wo_cost_vat || 0), fgColors: ['38AE00', '38AE00']}
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
