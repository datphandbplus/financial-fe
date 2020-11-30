import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SnackBarService, UtilitiesService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectLineItemService } from '@finance/project/services/project-line-item.service';
import { VOService } from '@finance/project/services/vo.service';

@Component({
	selector	: 'dialog-vo-remove',
	templateUrl	: '../templates/dialog-vo-remove.pug',
})
export class DialogVORemoveComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public isSubmitting: boolean;
	public loaded: boolean = true;
	public searchString: string = '';
	public selected: boolean = false;
	public backupData: Array<any> = [];
	public selectedItems: any = {};
	public vo: any = {};
	public displayedColumns: Array<string> = [
		'name', 'unit', 'amount',
		'price', 'total',
	];

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {SnackBarService} snackBarService
	* @param {ProjectLineItemService} projectLineItemService
	* @param {VOService} voService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef				: MatDialogRef<DialogVORemoveComponent>,
		public injector					: Injector,
		public snackBarService			: SnackBarService,
		public projectLineItemService	: ProjectLineItemService,
		public voService				: VOService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.vo, this.data );

		this.loaded = false;
		this.projectLineItemService
		.getAll(
			'valid_vo_remove',
			{
				project_id: this.vo.project_id,
				vo_id: this.vo.id,
			}
		)
		.subscribe( ( result: any ) => {
			this.loaded = true;

			if ( !result ) return;

			this.backupData = result;

			result = _.map( result, ( item: any ) => {
				item.total = item.price * item.amount;
				if ( item.vo_delete_id ) {
					item.checked = true;
					this.selectedItems[ item.id ] = { ...item };
				}

				return { ...item };
			});

			this.dataSource.data = result;
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
	* Update list items selected
	* @param {any} item
	* @return {void}
	*/
	public updateSelectedList( item: any ) {
		if ( item.checked ) this.selectedItems[ item.id ] = item;
		else delete this.selectedItems[ item.id ];

		this.selected = !_.isEmpty( this.selectedItems );
	}

	/**
	* Apply filter
	* @return {void}
	*/
	public applyFilter() {
		let newDataSource: Array<any> = _.map( this.backupData, ( item: any ) => ({ ...item }));

		if ( this.searchString && this.searchString.length ) {
			newDataSource = _.filter( newDataSource, ( item: any ) => {
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
		}

		newDataSource = _.map( newDataSource, ( item: any ) => {
			this.selectedItems[ item.id ] && ( item.checked = true );
			return item;
		});

		this.dataSource.data = newDataSource;
	}

	/**
	* update items
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.voService
		.removeItem( this.vo.id, _.map( this.selectedItems, ( item: any ) => item.id ) )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.REMOVE_ITEMS_PROJECT_VO_FAIL', this.vo );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.REMOVE_ITEMS_PROJECT_VO_SUCCESS', this.vo );

			this.dialogRef.close( true );
		} );
	}

}
