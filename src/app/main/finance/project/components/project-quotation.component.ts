import {
	OnInit, OnDestroy, Component,
	Injector, Input, ViewEncapsulation,
	Output, EventEmitter, ViewChild
} from '@angular/core';
import {
	animate, state, style,
	transition, trigger
} from '@angular/animations';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource, MatDialog } from '@angular/material';
import { Lightbox, LightboxConfig } from 'ngx-lightbox';
import _ from 'underscore';
import moment from 'moment-timezone';

import { DialogConfirmComponent } from '@core';
import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { DialogSheetComponent } from './dialog-sheet.component';
import { DialogProjectLineItemComponent } from './dialog-project-line-item.component';
import { DialogProjectQuotationDiscountComponent } from './dialog-project-quotation-discount.component';
import { ProjectService } from '@finance/project/services/project.service';
import { SheetService } from '@finance/project/services/sheet.service';
import { ProjectLineItemService } from '@finance/project/services/project-line-item.service';
import { ProjectCostItemService } from '@finance/project/services/project-cost-item.service';
import { VOService } from '@finance/project/services/vo.service';
import { DialogUploadFileComponent } from './dialog-upload-file.component';
import { QUOTATION_STATUS, DISCOUNT_STATUS, PROJECT_STATUS } from '@resources';
import { ENVIRONMENT } from '@environments/environment';
import {MatSort} from "@angular/material/sort";
import {TableUtil} from "@app/utils/tableUtils";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
	selector		: 'project-quotation',
	templateUrl		: '../templates/project-quotation.pug',
	styleUrls		: [ '../styles/project-quotation.scss' ],
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
export class ProjectQuotationComponent extends ProjectBaseComponent implements OnInit, OnDestroy {
	@ViewChild(MatSort) sort: MatSort;
	@Input() public project: any;

	@Input() public projectId: number;
	@Input() public loaded: boolean;
	@Input() public canManageProject: boolean;
	@Input() public canAddSheet: boolean;
	public sortArrays: any = {};

	@Output() public checkSheetApproval: EventEmitter<any> = new EventEmitter<any>();

	public isUploading: boolean;
	public uploadedFile: any;
	public loadedSheetDetail: boolean;
	public canManageLineItem: boolean;
	public sortable: boolean;
	public selectedTabIndex: number = 0;
	public detailRowScrollable: any = {};
	public projectSheets: Array<any> = [];
	public projectStatus: any = PROJECT_STATUS;
	public projectSheetDetail: any = {};
	public sheets: Array<any> = [];
	public groupList: Array<any> = [];
	public childGroupList: Array<any> = [];
	public imageList: Array<any> = [];
	public QUOTATION_STATUS: any = QUOTATION_STATUS;
	public DISCOUNT_STATUS: any = DISCOUNT_STATUS;
	public lineItemDataSource: Array<any> = [];
	public voList: Array<any> = [];
	public currentDate: any = moment();
	public overviewDisplayedColumns: Array<string> = [
		'sheet', 'description', 'note',
		'price', 'actions',
	];
	public lineItemDisplayedColumns: Array<string> = [
		'name', 'description', 'image',
		'unit', 'amount', 'price',
		'total', 'note', 'actions',
	];
	public overviewFooterRow: any = {};

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {Router} router
	* @param {ActivatedRoute} route
	* @param {ProjectService} projectService
	* @param {SheetService} sheetService
	* @param {ProjectLineItemService} projectLineItemService
	* @param {ProjectCostItemService} projectCostItemService
	* @param {VOService} voService
	* @param {Lightbox} lightbox
	* @param {LightboxConfig} lightboxConfig
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
		public sheetService				: SheetService,
		public projectLineItemService	: ProjectLineItemService,
		public projectCostItemService	: ProjectCostItemService,
		public voService				: VOService,
		public lightbox					: Lightbox,
		public lightboxConfig			: LightboxConfig
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
		// Lightbox Config
		this.lightboxConfig.centerVertically = true;

		this.getSheets();
	}

	private dynamicSort(property, direction) {
		return function (a,b) {
			const x1 = typeof a[property] === 'string' ? a[property].toLowerCase() : a[property];
			const x2 = typeof b[property] === 'string' ? b[property].toLowerCase() : b[property];
			return x1 == x2 ? 0 : ((direction > 0) ? (+(x1 > x2) || -1) : (+(x2 > x1) || -1));
		}
	}

	private resetSortOrder(fieldName: string) {
		const fields: string[] = Object.keys(this.sortArrays);
		fields.forEach((field: any) => {
			if (field !== fieldName.toLowerCase()) {
				this.sortArrays[field] = 0;
			}
		});
	}

	public sortSheets(index: number, fieldName: string) {
		this.resetSortOrder(fieldName);
		if (this.lineItemDataSource[ index ].data.length === 2 &&  this.lineItemDataSource[ index ].data[1].child_groups) {
			if (this.sortArrays[fieldName] === 0) {
				this.sortArrays[fieldName] = 1;
			} else if (this.sortArrays[fieldName] === 1) {
				this.sortArrays[fieldName] = -1;
			} else {
				this.sortArrays[fieldName] = 0;
			}
			if (this.sortArrays[fieldName] !== 0) {
				this.lineItemDataSource[index].data[1].child_groups[0].items.sort(this.dynamicSort(fieldName, this.sortArrays[fieldName]));
			} else {
				this.lineItemDataSource[index].data[1].child_groups[0].items.sort(this.dynamicSort('id', 1));
			}
		}
	}

	/**
	* Back to projects list
	* @return {void}
	*/
	public backToList() {
		this.router.navigate( [ 'finance/project' ] );
	}

	/**
	* Change priority
	* @param {any} detail
	* @param {number} index
	* @return {void}
	*/
	public changePriority( detail: any, index: number ) {
		if ( detail.items.length === 1 ) return;

		detail.items.splice( index + 1, 0, detail.items.splice( index, 1 )[ 0 ] );
	}

	/**
	* Change group priority
	* @param {number} index
	* @return {void}
	*/
	public changeGroupPriority( index: number ) {
		const data: Array<any> = _.clone( this.lineItemDataSource[ this.selectedTabIndex - 1 ].data );

		// Prevent last item exchange order position
		if ( !data || index + 2 >= data.length ) return;

		const mainRowSwap: any = data[ index ];
		const detailRowSwap: any = data[ index + 1 ];

		// Move main row
		data[ index ] = data[ index + 2 ];
		data[ index + 2 ] = mainRowSwap;

		// Move detail row
		data[ index + 1 ] = data[ index + 3 ];
		data[ index + 3 ] = detailRowSwap;

		this.lineItemDataSource[ this.selectedTabIndex - 1 ].data = data;
	}

	/**
	* Change priority
	* @param {any} detail
	* @param {number} index
	* @return {void}
	*/
	public changeChildGroupPriority( detail: any, index: number ) {
		if ( detail.child_groups.length === 1 ) return;

		detail.child_groups.splice( index + 1, 0, detail.child_groups.splice( index, 1 )[ 0 ] );
	}

	/**
	* Toggle sort priority
	* @return {void}
	*/
	public toggleSortPriority() {
		this.sortable = !this.sortable;

		if ( this.sortable ) return;

		const priorities: Array<any> = [];

		_.each( this.lineItemDataSource[ this.selectedTabIndex - 1 ].data, ( lineItem: any, indexGroup: number ) => {
			_.each( lineItem.child_groups, ( lineItemChild: any, indexChild: number ) => {
				_.each( lineItemChild.items, ( item: any, index: number ) => {
					priorities.push({
						id		: item.id,
						priority: [ ( indexGroup - 1 ) / 2 , indexChild, index ].join( '-' ),
					});
				} );
			} );
		} );

		this.loadedSheetDetail = false;

		this.projectLineItemService
		.updatePriority( this.projectSheetDetail.id , priorities )
		.subscribe( ( result: any ) => {
			this.loadedSheetDetail = true;
			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_LINE_ITEM_PRIORITY_FAIL' );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_LINE_ITEM_PRIORITY_SUCCESS' );
		} );
	}

	/**
	* Tab changed
	* @param {number} tabIndex
	* @return {void}
	*/
	public tabChanged( tabIndex: number ) {
		this.selectedTabIndex = tabIndex;

		if ( tabIndex === 0 ) {
			( !this.projectSheets || !this.projectSheets.length )
				&& this.getSheets();
			return;
		}

		if ( tabIndex <= this.projectSheets.length ) {
			this.projectSheetDetail = this.projectSheets[ tabIndex - 1 ];

			( !this.lineItemDataSource[ this.selectedTabIndex - 1 ].data
				|| !this.lineItemDataSource[ this.selectedTabIndex - 1 ].data.length
			)
			&& this.getSheetDetail( this.projectSheetDetail.id );
		}
	}

	/**
	* Show group detail
	* @param {any} lineItem - Line item data
	* @return {void}
	*/
	public showGroupDetail( lineItem: any ) {
		lineItem.show_detail_row = !lineItem.show_detail_row;
		this.detailRowScrollable[ lineItem.group ] = true;
		setTimeout( () => this.detailRowScrollable[ lineItem.group ] = false, 255 );
	}

	/**
	* Delete sheet
	* @param {any} sheet - Sheet data need delete
	* @return {void}
	*/
	public deleteSheet( sheet: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DELETE_SHEET' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DELETE_SHEET_CONFIRMATION', sheet ),
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

			this.sheetService
			.delete( sheet.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_SHEET_FAIL', sheet );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_SHEET_SUCCESS', sheet );

				this.getSheets();
			} );
		} );
	}

	/**
	* Open dialog sheet to create/update
	* @param {any} sheet - Sheet data need create/update
	* @return {void}
	*/
	public openDialogSheet( sheet?: any ) {
		const dialogComponent: any = DialogSheetComponent;

		const dialogRef: any = this.dialog.open(
			dialogComponent,
			{
				width: '450px',
				data: {
					project_id	: this.project.id,
					project_name: this.project.name,
					is_approved	: this.project.is_approved,
					id			: sheet && sheet.id ,
					name		: sheet && sheet.name,
					note		: sheet && sheet.note,
					description	: sheet && sheet.description,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getSheets();
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
					project_sheet_id		: this.projectSheetDetail.id,
					project_sheet_name		: this.projectSheetDetail.name,
					id						: data.id,
					groups					: this.groupList,
					group					: data.group,
					child_groups			: this.childGroupList,
					child_group				: data.child_group,
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

			this.getSheetDetail( this.projectSheetDetail.id );
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

			this.projectLineItemService
			.delete( lineItem.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_LINE_ITEM_FAIL', lineItem );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_LINE_ITEM_SUCCESS', lineItem );

				this.getSheetDetail( this.projectSheetDetail.id );
			} );
		} );
	}

	/**
	* Get sheets
	* @return {void}
	*/
	public getSheets() {
		this.setProcessing( true );
		this.loaded = false;
		this.sheets = [];

		this.projectService
		.getOne( this.projectId )
		.subscribe( ( result: any ) => {

			this.overviewFooterRow = {
				subtotal		: 0,
				total			: 0,
				total_with_vat	: 0,
				vat				: 0,
				discount_value	: 0,
				total_vo_wo_vat	: 0,
				vo_vat			: 0,
				total_vo_w_vat	: 0,
			};

			this.voService
			.getAll( 'project_vo_approved', this.projectId )
			.subscribe( ( _result: any ) => {
				this.setProcessing( false );
				this.loaded = true;

				_.each( _result, ( item: any ) => {
					this.overviewFooterRow.total_vo_wo_vat += item.diff_quotation_total;
					this.overviewFooterRow.vo_vat += item.diff_quotation_vat;
					this.overviewFooterRow.total_vo_w_vat += item.diff_quotation_vat + item.diff_quotation_total;
				});

				this.voList = _result;
			} );

			const _projectSheets: any = result.project_sheets;
			_.each( _projectSheets, () => {
				this.lineItemDataSource.push( new MatTableDataSource<any>( [] ) );
			} );

			_.each( _projectSheets, ( item: any ) => {
				this.sheets.push({
					sheet_id	: item.id,
					name		: item.name,
				});

				item.sheet_total = 0;

				_.each( item.project_line_items, ( projectLineItemItem: any ) => {
					item.sheet_total += +projectLineItemItem.price * +projectLineItemItem.amount;
				});

				this.overviewFooterRow.subtotal += +item.sheet_total;
			} );

			this.overviewFooterRow.discount_value = this.project.discount_type === '$'
				? +this.project.discount_amount
				: +this.overviewFooterRow.subtotal * this.project.discount_amount / 100;
			this.overviewFooterRow.total = +this.overviewFooterRow.subtotal - this.overviewFooterRow.discount_value;
			this.overviewFooterRow.vat = +this.overviewFooterRow.total * 0.1;
			this.overviewFooterRow.total_with_vat = +this.overviewFooterRow.vat + +this.overviewFooterRow.total;
			this.projectSheets = _projectSheets;
			this.dataSource.sort = this.sort;
			this.dataSource.data = _projectSheets;
			this.checkSheetApproval.emit( this.sheets );
		} );
	}

	/**
	* Get project line item list
	* @param {any} id - Sheet id
	* @param {number} lineItemId - Line Item id
	* @return {void}
	*/
	public getSheetDetail( id: number ) {
		this.sortArrays = {'name': 0, 'description': 0, 'unit': 0, 'amount': 0, 'price': 0, 'total': 0, 'note': 0};
		this.setProcessing( true );
		this.loadedSheetDetail = false;

		this.projectLineItemService
		.getAll( 'all', { project_sheet_id: id } )
		.subscribe( ( result: any ) => {
			const dataSourceWithExpanded: Array<any> = [];

			this.setProcessing( false );
			this.loadedSheetDetail = true;
			this.groupList = [];
			this.childGroupList = [];
			this.imageList = [];
			this.lineItemDataSource[ this.selectedTabIndex - 1 ].footerTotal = 0;

			// Prevent new added Project line item prepent on top of No Group
			result = _.sortBy(
				result,
				( item: any ) => [ item.priority, item.group, item.child_group ].join( '-' )
			);

			_.each( result, ( lineItem: any ) => {
				lineItem.group = lineItem.group || '';
				lineItem.child_group = lineItem.child_group || '';

				lineItem.group
					&& !_.findWhere( this.groupList, { id: lineItem.group } )
					&& this.groupList.push({
						id	: lineItem.group,
						name: lineItem.group,
					});

				lineItem.child_group
					&& !_.findWhere( this.childGroupList, { id: lineItem.child_group } )
					&& this.childGroupList.push({
						id		: lineItem.child_group,
						name	: lineItem.child_group,
						parent	: lineItem.group,
					});
				const detailRow: any = _.findWhere( dataSourceWithExpanded, { group: lineItem.group, detail_row: true } );
				const lineItemTotal: number = lineItem.amount * lineItem.price;

				lineItem.total = lineItemTotal;
				this.lineItemDataSource[ this.selectedTabIndex - 1 ].footerTotal += lineItemTotal;

				// Image Lightbox
				if ( lineItem.image ) {
					lineItem.image_index = this.imageList.length;
					this.imageList.push({ src: [ ENVIRONMENT.SERVER_API_URL, lineItem.image ].join( '/' ) });
				}

				if ( !detailRow ) {
					const groupInfo: any = {
						group			: lineItem.group,
						total			: lineItemTotal,
						show_detail_row	: true,
						main_row		: true,
					};

					dataSourceWithExpanded.splice( !lineItem.group ? 0 : dataSourceWithExpanded.length, 0,
						groupInfo,
						{
							group_info	: groupInfo,
							group		: lineItem.group,
							detail_row	: true,
							child_groups: [
								{
									child_group	: lineItem.child_group,
									total		: lineItemTotal,
									items		: [ lineItem ],
								},
							],
						}
					);
				} else {
					const mainRow: any = _.findWhere( dataSourceWithExpanded, { group: lineItem.group, main_row: true } );
					const childRow: any = _.findWhere( detailRow.child_groups, { child_group: lineItem.child_group } );

					if ( !childRow ) {
						detailRow.child_groups.splice( !lineItem.child_group ? 0 : detailRow.child_groups.length, 0, {
							child_group	: lineItem.child_group,
							total		: lineItemTotal,
							items		: [ lineItem ],
						});
					} else {
						childRow.items.push( lineItem );
						childRow.total += lineItemTotal;
					}

					mainRow.total += lineItemTotal;
				}
			});
			this.lineItemDataSource[ this.selectedTabIndex - 1 ].data = dataSourceWithExpanded;
		} );
	}

	public getSheetDetailForExport( result ) {
		const dataSourceWithExpanded: Array<any> = [];
		const groupList: Array<any> = [];
		const childGroupList: Array<any> = [];
		const imageList: Array<any> = [];
		let lineItemDataSource: any = {};
		lineItemDataSource = new MatTableDataSource<any>( [] );
		lineItemDataSource.footerTotal = 0;

		// Prevent new added Project line item prepent on top of No Group
		result = _.sortBy(
			result,
			( item: any ) => [ item.priority, item.group, item.child_group ].join( '-' )
		);

		_.each( result,  ( lineItem: any ) => {
			lineItem.group = lineItem.group || '';
			lineItem.child_group = lineItem.child_group || '';

			lineItem.group
			&& !_.findWhere(groupList, { id: lineItem.group } )
			&& groupList.push({
				id	: lineItem.group,
				name: lineItem.group,
			});

			lineItem.child_group
			&& !_.findWhere( childGroupList, { id: lineItem.child_group } )
			&& childGroupList.push({
				id		: lineItem.child_group,
				name	: lineItem.child_group,
				parent	: lineItem.group,
			});
			const detailRow: any = _.findWhere( dataSourceWithExpanded, { group: lineItem.group, detail_row: true } );
			const lineItemTotal: number = lineItem.amount * lineItem.price;

			lineItem.total = lineItemTotal;
			lineItemDataSource.footerTotal += lineItemTotal;

			// Image Lightbox
			if ( lineItem.image ) {
				lineItem.image_index = imageList.length;
				imageList.push({ src: [ ENVIRONMENT.SERVER_API_URL, lineItem.image ].join( '/' ) });
			}

			if ( !detailRow ) {
				const groupInfo: any = {
					group			: lineItem.group,
					total			: lineItemTotal,
					show_detail_row	: true,
					main_row		: true,
				};

				dataSourceWithExpanded.splice( !lineItem.group ? 0 : dataSourceWithExpanded.length, 0,
					groupInfo,
					{
						group_info	: groupInfo,
						group		: lineItem.group,
						detail_row	: true,
						child_groups: [
							{
								child_group	: lineItem.child_group,
								total		: lineItemTotal,
								items		: [ lineItem ],
							},
						],
					}
				);
			} else {
				const mainRow: any = _.findWhere( dataSourceWithExpanded, { group: lineItem.group, main_row: true } );
				const childRow: any = _.findWhere( detailRow.child_groups, { child_group: lineItem.child_group } );

				if ( !childRow ) {
					detailRow.child_groups.splice( !lineItem.child_group ? 0 : detailRow.child_groups.length, 0, {
						child_group	: lineItem.child_group,
						total		: lineItemTotal,
						items		: [ lineItem ],
					});
				} else {
					childRow.items.push( lineItem );
					childRow.total += lineItemTotal;
				}

				mainRow.total += lineItemTotal;
			}
		});
		lineItemDataSource.data = dataSourceWithExpanded;
		return lineItemDataSource;
	}

	/**
	* Download template
	* @return {void}
	*/
	public exportExcel() {
		const titles = ['Master List'];
		const sheetNames = ['Master'];
		const fileName = `${TableUtil.slug(this.project.name || '')}_Quotation`;
		const infoData = {
			data: [
				{
					title: this.translateService.instant('FINANCE.PROJECT.LABELS.PROJECT_CODE'),
					value: this.project.project_code || 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.CLIENT.LABELS.CLIENT'),
					value: (this.project.client && this.project.client.short_name) ? this.project.client.short_name : 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.PROJECT.LABELS.CONTACT_PERSON'),
					value: this.project.contact || 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.CLIENT.LABELS.ADDRESS'),
					value: this.project.address || 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.USER.LABELS.PM'),
					value: (this.project.user && this.project.user.full_name) ? this.project.user.full_name : 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.USER.LABELS.SALE'),
					value: (this.project.saler && this.project.saler.full_name) ? this.project.saler.full_name : 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.USER.LABELS.PROCUREMENT_MANAGER'),
					value: (this.project.procurement_manager && this.project.procurement_manager.full_name) ? this.project.procurement_manager.full_name : 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.USER.LABELS.QS'),
					value: (this.project.qs && this.project.qs.full_name) ? this.project.qs.full_name : 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.USER.LABELS.PURCHASING'),
					value: (this.project.purchaser && this.project.purchaser.full_name) ? this.project.purchaser.full_name : 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.USER.LABELS.CONSTRUCTION'),
					value: (this.project.constructor && this.project.constructor.full_name) ? this.project.constructor.full_name : 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.PROJECT.LABELS.PROJECT_TIME'),
					value: (this.project.project_start && this.project.project_end) ? (TableUtil.getDateFormatForExcel(new Date(this.project.project_start) ) + ' - ' + TableUtil.getDateFormatForExcel(new Date(this.project.project_end))) : 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.PROJECT.LABELS.QUOTATION_DATE'),
					value: this.project.quotation_date ? TableUtil.getDateFormatForExcel(new Date(this.project.quotation_date)) : 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.PROJECT.LABELS.MINIMUM_PAYMENT_PERIOD'),
					value: this.project.valid_duration
						? (this.project.valid_duration + ' ' +  this.translateService.instant('GENERAL.LABELS.DAYS').toLowerCase())
						: 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.PROJECT.LABELS.EXCHANGE_RATE'),
					value: this.project.exchange_rate
						? ('1 ' +  this.translateService.instant('GENERAL.LABELS.MONEY_UNIT') + ' = ' + TableUtil.pad(this.project.exchange_rate, 2))
						: 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.PROJECT.LABELS.QUOTATION_STATUS'),
					value: (this.project.quotation_status_name && this.project.quotation_status_name.name)
						? this.translateService.instant(this.project.quotation_status_name.name)
						: 'N/A',
					bgColor:  (this.project.quotation_status_name && this.project.quotation_status_name.color)
						? this.project.quotation_status_name.color.replace('#', '')
						: ''
				},
				{
					title: this.translateService.instant('FINANCE.PROJECT.LABELS.PROJECT_STATUS'),
					value: (this.project.project_status_name && this.project.project_status_name.name)
						? this.translateService.instant(this.project.project_status_name.name)
						: 'N/A',
					bgColor:  (this.project.project_status_name && this.project.project_status_name.color)
						? this.project.project_status_name.color.replace('#', '')
						: ''
				}
			],
			cols: 4
		};
		const exportDatas: any[] = [];
		const extraDatas: any[] = [];
		const headerSettings: any[] = [
			{
				header: ['Sheet', 'Description', 'Note', 'Price'],
				fgColor: 'ffffff',
				bgColor: '00245A',
				noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'quotation'})
			}
		];
		const exportDataMaster: any[] = [];
		this.dataSource.data.forEach((item: any) => {
			const dataItemMaster: any[] = [];
			dataItemMaster.push(item.name || 'N/A');
			dataItemMaster.push(item.description || 'N/A');
			dataItemMaster.push(item.note || 'N/A');
			dataItemMaster.push(TableUtil.getNumberFormatForExcel(item.sheet_total || 0));
			exportDataMaster.push(dataItemMaster);
		});
		const extraDataMaster = [
			{title: 'Sub Total', value: TableUtil.getNumberFormatForExcel(this.overviewFooterRow.subtotal || 0), fgColors: ['FD8631', 'FD8631']},
			{title: 'Discount', value: TableUtil.getNumberFormatForExcel(this.overviewFooterRow.discount_value || 0), fgColors: ['FD8631', 'FD8631']},
			{title: 'Total (excluded VAT)', value: TableUtil.getNumberFormatForExcel(this.overviewFooterRow.total || 0), fgColors: ['FD8631', 'FD8631']},
			{title: 'VAT', value: TableUtil.getNumberFormatForExcel(this.overviewFooterRow.vat || 0), fgColors: ['FD8631', 'FD8631']},
			{title: 'Total (included VAT)', value: TableUtil.getNumberFormatForExcel(this.overviewFooterRow.total_with_vat || 0), fgColors: ['FD8631', 'FD8631']}
		];
		exportDatas.push(exportDataMaster);
		extraDatas.push(extraDataMaster);
		const _this = this;
		const travelCount = this.sheets.length;
		let travelIndex = 0;
		for (const sheet of this.sheets) {
			let _ind = this.sheets.indexOf(sheet);
			_this.projectLineItemService
				.getAll( 'all', { project_sheet_id: _this.projectSheets[ _ind ].id } )
				.subscribe( ( result: any ) => {
					const exportData: any[] = [];
					const dataSource = _this.getSheetDetailForExport(result);
					if (dataSource.data && dataSource.data.length === 2 && dataSource.data[1].child_groups[0] &&
						dataSource.data[1].child_groups[0].items && dataSource.data[1].child_groups[0].items.length > 0) {
						dataSource.data[1].child_groups[0].items.forEach((item: any) => {
							const dataItem: any[] = [];
							dataItem.push(item.name || 'N/A');
							dataItem.push(item.description || 'N/A');
							dataItem.push(item.unit || 'N/A');
							dataItem.push(TableUtil.pad(Math.floor(item.amount + .5 || 0), 2));
							dataItem.push(TableUtil.getNumberFormatForExcel(item.price || 0));
							dataItem.push(TableUtil.getNumberFormatForExcel(item.total || 0));
							dataItem.push(item.note || 'N/A');
							exportData.push(dataItem);
						});
						const extraData = [
							{
								title: 'Total',
								value: TableUtil.getNumberFormatForExcel(dataSource.data[1].child_groups[0].total || 0),
								fgColors: ['38AE00', 'FD8631']
							}
						];
						headerSettings.push({
							header: ['Name', 'Description', 'Unit', 'Amount', 'Price', 'Total', 'Note'],
							fgColor: 'ffffff',
							bgColor: '00245A',
							widths: [45, 45, 15, 25, 25, 25, 45],
							noData: _this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'quotation'})
						});
						titles.push(`${sheet.name || 'sub'}`);
						sheetNames.push(sheet.name || 'Sub_' + _ind);
						exportDatas.push(exportData);
						extraDatas.push(extraData);
					}
					travelIndex++;
					if (travelIndex === travelCount) {
						_this.excelService.exportArraysToExcel(
							exportDatas,
							titles,
							headerSettings,
							sheetNames,
							fileName,
							extraDatas,
							infoData
						);
					}
				});
		}
	}

	/**
	* Open dialog import file
	* @return {void}
	*/
	public openDialogUploadFile() {
		const dialogRef: any = this.dialog.open(
			DialogUploadFileComponent,
			{
				width: '400px',
				data: {
					upload_file_destination	: 'line',
					project_id				: this.projectId,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result || !result.file_location ) return;

			// in case of had duplicated sheet(s)
			if ( result.is_sheet_duplicated === true ) {
				const _dialogRef: any = this.dialog.open(
					DialogConfirmComponent,
					{
						width: '400px',
						data: {
							title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DUPLICATED_SHEETS' ),
							content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DUPLICATED_SHEETS_CONFIRMATION' ),
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
		this.projectLineItemService
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

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPLOAD_PROJECT_LINE_ITEMS_FAIL' );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPLOAD_PROJECT_LINE_ITEMS_SUCCESS', result.data );

			this.getSheets();
		} );
	}

	/**
	* Open image lightbox
	* @param {any} item
	* @return {void}
	*/
	public openLightbox( item: any ) {
		if ( !item || !item.image ) return;

		const imageData: Array<any> = [
			{ src: [ ENVIRONMENT.SERVER_API_URL, item.image ].join( '/' ) },
		];

		this.lightbox.open( imageData, 0 );
	}


	/**
	* Open dialog quotation discount
	* @return {void}
	*/
	public openDialogQuotationDiscount() {
		const dialogComponent: any = DialogProjectQuotationDiscountComponent;

		const dialogRef: any = this.dialog.open(
			dialogComponent,
			{
				width: '600px',
				data: {
					id				: this.project.id,
					name			: this.project.name,
					is_approved		: this.project.is_approved,
					discount_amount	: this.project.discount_amount,
					discount_type	: this.project.discount_type,
					subtotal		: this.overviewFooterRow.subtotal,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.project.discount_amount = result.discount_amount;
			this.project.discount_type = result.discount_type;
			this.getSheets();
		} );
	}

}
