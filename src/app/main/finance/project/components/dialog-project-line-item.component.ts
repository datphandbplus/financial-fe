import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectLineItemService } from '@finance/project/services/project-line-item.service';
import { LineItemCategoryService } from '@finance/line-item/services/line-item-category.service';

@Component({
	selector	: 'dialog-project-line-item',
	templateUrl	: '../templates/dialog-project-line-item.pug',
})
export class DialogProjectLineItemComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public loaded: boolean;
	public lineItemForm: FormGroup;
	public isSubmitting: boolean;
	public isUploading: boolean;
	public hasImage: boolean;
	public uploadedFile: any;
	public groupList: Array<any> = [];
	public childGroupList: Array<any> = [];
	public childGroupBackUpList: Array<any> = [];
	public lineItem: any = {
		id						: null,
		project_sheet_name		: null,
		project_sheet_id		: null,
		group					: null,
		child_group				: null,
		line_item_category_id	: null,
		name					: null,
		unit					: null,
		amount					: 0,
		price					: 0,
		description				: null,
		note					: null,
	};

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialog} dialog
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectLineItemService} projectLineItemService
	* @param {LineItemCategoryService} lineItemCategoryService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialog					: MatDialog,
		public dialogRef				: MatDialogRef<DialogProjectLineItemComponent>,
		public injector					: Injector,
		public fb						: FormBuilder,
		public snackBarService			: SnackBarService,
		public projectLineItemService	: ProjectLineItemService,
		public lineItemCategoryService	: LineItemCategoryService,
	) {
		super( injector );

		this.lineItemForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			unit: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			amount: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			price: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			group					: [{ value: null, disabled: false }],
			child_group				: [{ value: null, disabled: false }],
			line_item_category_id	: [{ value: null, disabled: false }],
			description				: [{ value: null, disabled: false }],
			note					: [{ value: null, disabled: false }],
			total					: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.lineItem, this.data );
		this.groupList = this.lineItem.groups;
		this.childGroupBackUpList = this.lineItem.child_groups;
		this.updateChildGroupList();

		if ( this.lineItem.image ) {
			this.hasImage = true;

			if ( !this.lineItem.image.length ) return;
			this.lineItem.image_name = this.lineItem.image.toString().split( '/' ).slice( -1 ).pop();
		}
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
	* Update Total
	* @return {void}
	*/
	public updateTotal() {
		this.lineItem.total = this.lineItem.amount * this.lineItem.price;
	}

	/**
	* Update child group listing
	* @param {string} group
	* @return {void}
	*/
	public updateChildGroupList( group: string = null ) {
		this.childGroupList = _.where( this.childGroupBackUpList, { parent: group } );
		if ( this.lineItem.group !== this.data.group ) this.lineItem.child_group = null;
	}

	/**
	* Create project
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.projectLineItemService
		.create( this.lineItem )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_LINE_ITEM_FAIL', this.lineItem );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_LINE_ITEM_SUCCESS', this.lineItem );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update project
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.projectLineItemService
		.update( this.lineItem.id, this.lineItem )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_LINE_ITEM_FAIL', this.lineItem );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_LINE_ITEM_SUCCESS', this.lineItem  );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Handle upload invoice file
	* @param {any} event
	* @return {void}
	*/
	public onFileSelected( event: any ) {
		this.isUploading = true;

		this.projectLineItemService
		.uploadImage( event.file )
		.subscribe( ( result: any ) => {
			this.isUploading = false;
			event.input.nativeElement.value = null;

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

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPLOAD_PROJECT_LINE_ITEM_IMAGE_FAIL' );
				return;
			}

			this.uploadedFile = result.data && result.data[ 0 ];
			this.lineItem.image = this.uploadedFile.path;
		} );
	}

}
