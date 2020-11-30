import {
	OnInit, OnDestroy,
	Component, Injector
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { CostItemCategoryService } from '@finance/cost-item/services/cost-item-category.service';
import { DialogCostItemCategoryComponent } from './dialog-cost-item-category.component';
import { DialogConfirmComponent } from '@core';

@Component({
	selector	: 'cost-item-category',
	templateUrl	: '../templates/cost-item-category.pug',
	styleUrls	: [ '../styles/cost-item-category.scss' ],
})
export class CostItemCategoryComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public loaded: boolean;
	public isDeleting: boolean;
	public displayedColumns: Array<string> = [ 'name', 'description', 'actions' ];

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {CostItemCategoryService} costItemCategoryService
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	*/
	constructor(
		public injector					: Injector,
		public dialog					: MatDialog,
		public costItemCategoryService	: CostItemCategoryService,
		public snackBarService			: SnackBarService,
		public translateService			: TranslateService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
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
	* Get cost item category list
	* @return {void}
	*/
	public getList() {
		this.loaded = false;
		this.setProcessing( true );

		this.costItemCategoryService
		.getAll()
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			this.dataSourceClone = result;
			this.dataSource.data = result;
			this.applyFilter();
		} );
	}

	/**
	* Open dialog cost item category
	* @param {any} costItemCategory - Cost item category to bind to dialog
	* @return {void}
	*/
	public openDialog( costItemCategory?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogCostItemCategoryComponent,
			{
				width	: '450px',
				data	: costItemCategory || null,
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
	* Delete cost item category
	* @param {any} costItemCategory - Cost item category to delete
	* @return {void}
	*/
	public delete( costItemCategory: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title: this.translateService.instant( 'FINANCE.COST_ITEM_CATEGORY.TITLES.DELETE_COST_ITEM_CATEGORY' ),
					content: this.translateService.instant(
						'FINANCE.COST_ITEM_CATEGORY.MESSAGES.DELETE_COST_ITEM_CATEGORY_CONFIRMATION',
						costItemCategory
					),
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

			this.setProcessing( true );
			this.isDeleting = true;

			this.costItemCategoryService
			.delete( costItemCategory.id )
			.subscribe( ( result: any ) => {
				this.setProcessing( false );
				this.isDeleting = false;

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.COST_ITEM_CATEGORY.MESSAGES.DELETE_COST_ITEM_CATEGORY_FAIL', costItemCategory );
					return;
				}

				this.snackBarService.success( 'FINANCE.COST_ITEM_CATEGORY.MESSAGES.DELETE_COST_ITEM_CATEGORY_SUCCESS', costItemCategory );

				this.getList();
			} );
		} );
	}

}
