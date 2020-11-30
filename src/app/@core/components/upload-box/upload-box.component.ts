import {
	Component, Input, ViewChild,
	Output, EventEmitter
} from '@angular/core';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { CONSTANTS } from '@resources';

@Component({
	selector	: 'upload-box',
	templateUrl	: './upload-box.pug',
})
export class UploadBoxComponent {

	@ViewChild( 'fileInput' ) public fileInput: HTMLInputElement;

	@Input() public uploading: boolean;
	@Input() public disabled: boolean;
	@Input() public label: string;
	@Input() public allowFileSize: number = CONSTANTS.ALLOW_FILE_SIZE / 1024 / 1024;
	@Input() public allowFormats: Array<string> = CONSTANTS.ALLOW_IMAGE_FILES.concat( CONSTANTS.ALLOW_DOCUMENT_FILES );
	@Input() public allowExtensions: Array<string> = [
		'.jpg', '.jpeg', '.png',
		'.gif', '.pdf', '.doc',
		'.docx', '.xls', '.xlsx',
		'.ppt', '.pptx',
	];

	@Output() public onFileSelected: EventEmitter<any> = new EventEmitter<any>();

	public selectedFile: File;

	/**
	* @constructor
	* @param {SnackBarService} snackBarService
	*/
	constructor( public snackBarService: SnackBarService ) {}

	/**
	* Check file selected
	* @param {any} event
	* @return {void}
	*/
	public checkFileSelected( event: any ) {
		const selectedFile: File = <File> event.target.files[ 0 ];

		if ( !_.contains( this.allowFormats, selectedFile.type ) ) {
			this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_TYPE' );
			return;
		}

		if ( selectedFile.size > CONSTANTS.ALLOW_FILE_SIZE ) {
			this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_SIZE' );
			return;
		}

		this.selectedFile = selectedFile;
		this.onFileSelected.emit( { file: this.selectedFile, input: this.fileInput } );
	}

}
