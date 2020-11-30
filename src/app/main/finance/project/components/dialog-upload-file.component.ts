import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as XLSX from 'xlsx';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { AccountService } from '@account/services/account.service';
import { SheetService } from '@finance/project/services/sheet.service';

@Component({
	selector	: 'dialog-upload-file',
	templateUrl	: '../templates/dialog-upload-file.pug',
})
export class DialogUploadFileComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public isUploading: boolean;
	public isSheetDuplicated: boolean;
	public uploadFileDestination: string;
	public projectId: number;
	public fileLocation: any;

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {AccountService} accountService
	* @param {SheetService} sheetService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef		: MatDialogRef<DialogUploadFileComponent>,
		public injector			: Injector,
		public accountService	: AccountService,
		public sheetService		: SheetService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.uploadFileDestination = this.data.upload_file_destination;
		this.projectId = this.data.project_id;
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
		this.dialogRef.close( false );
	}

	/**
	* Handle upload Project line items file
	* @param {any} event
	* @return {void}
	*/
	public onFileSelected( event: any ) {
		this.fileLocation = event.file;

		if ( this.uploadFileDestination === 'line' ) {
			const reader: FileReader = new FileReader();

			reader.onload = ( e: any ) => {
				const data: Uint8Array = new Uint8Array( e.target.result );
				const workbook: XLSX.WorkBook = XLSX.read( data, { type: 'array' } );

				this.sheetService
				.getAll( 'reference', this.projectId )
				.subscribe( ( result: any ) => {
					if ( result
						&& result.length
						&& workbook
						&& workbook.SheetNames
						&& workbook.SheetNames.length
						&& _.intersection( _.map( result, 'name' ), workbook.SheetNames ).length ) {
						this.isSheetDuplicated = true;
					}
				} );
			};

			reader.readAsArrayBuffer( this.fileLocation );
		}
	}

	/**
	* Handle upload
	* @return {void}
	*/
	public onUpload() {
		this.dialogRef.close( {
			file_location       : this.fileLocation,
			is_sheet_duplicated : this.uploadFileDestination === 'line' && this.isSheetDuplicated,
		} );
	}

}
