import {
	OnDestroy, Component, OnInit,
	Injector, ElementRef
} from '@angular/core';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';
import * as $ from 'jquery';
import * as Cropper from 'cropperjs';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FinanceBaseComponent } from '@finance/finance-base.component';
import { FormService } from '@core';
import { SettingService } from '@finance/settings/services/setting.service';
import { ENVIRONMENT } from '@environments/environment';
import { CONSTANTS } from '@resources';

@Component({
	selector	: 'general',
	templateUrl	: '../templates/general.pug',
	styleUrls	: [ '../styles/general.scss' ],
})
export class GeneralComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public cropper: any;
	public settingForm: FormGroup;
	public selectedFile: File;
	public newLogoFile: File;
	public isUpdating: boolean;
	public isUploading: boolean;
	public previewLogo: string;
	public CONSTANTS: any = CONSTANTS;
	public originalSettings: any = {};
	public setting: any = {
		branch_logo					: null,
		branch_primary_color		: '#000000',
		branch_secondary_color		: '#000000',
		quotation_wht				: 0,
		quotation_agency_fee		: 0,
		quoation_note				: null,
		contract_signer_full_name	: null,
		contract_signer_title		: null,
		exchange_rate				: 1,
		management_fee				: 0,
		total_extra_fee				: 0,
		extra_cost_fee				: 0,
		max_po_price				: 0,
	};
	public defaultOptions: any = {
		preview			: '#cropper-preview',
		minCropBoxWidth	: 300,
		minCropBoxHeight: 300,
		minCanvasWidth	: 300,
		minCanvasHeight	: 300,
		autoCropArea	: .1,
		viewMode		: 1,
	};

	/**
	* @constructor
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {ElementRef} elementRef
	* @param {SnackBarService} snackBarService
	* @param {SettingService} settingService
	*/
	constructor(
		public injector			: Injector,
		public fb				: FormBuilder,
		public elementRef		: ElementRef,
		public snackBarService	: SnackBarService,
		public settingService	: SettingService
	) {
		super( injector );

		this.settingForm = fb.group({
			branch_primary_color: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 7 ),
				]),
			],
			branch_secondary_color: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 7 ),
				]),
			],
			contract_signer_full_name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 0 ),
					Validators.maxLength( 255 ),
				]),
			],
			contract_signer_title: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 0 ),
					Validators.maxLength( 255 ),
				]),
			],
			exchange_rate: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 1 ),
				]),
			],
			management_fee: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			total_extra_fee: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			extra_cost_fee: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			max_po_price: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			quotation_note: [{ value: null, disabled: false }],
		});
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
		this.getSetting();
	}

	/**
	* Get setting
	* @return {void}
	*/
	public getSetting() {
		this.settingService
		.getAll()
		.subscribe( ( result: any ) => {
			_.each( result, ( item: any ) => {
				switch ( item.key ) {
					case 'BRANCH_LOGO':
						this.setting.branch_logo = item.value;
						this.previewLogo = item.value
							? [ ENVIRONMENT.SERVER_API_URL, item.value ].join( '/' )
							: null;
						break;
					case 'BRANCH_PRIMARY_COLOR':
						this.setting.branch_primary_color = item.value;
						break;
					case 'BRANCH_SECONDARY_COLOR':
						this.setting.branch_secondary_color = item.value;
						break;
					case 'QUOTATION_WHT':
						this.setting.quotation_wht = item.value;
						break;
					case 'QUOTATION_AGENCY_FEE':
						this.setting.quotation_agency_fee = item.value;
						break;
					case 'QUOTATION_NOTE':
						this.setting.quotation_note = item.value;
						break;
					case 'CONTRACT_SIGNER_FULL_NAME':
						this.setting.contract_signer_full_name = item.value;
						break;
					case 'CONTRACT_SIGNER_TITLE':
						this.setting.contract_signer_title = item.value;
						break;
					case 'EXCHANGE_RATE':
						this.setting.exchange_rate = item.value;
						break;
					case 'MANAGEMENT_FEE':
						this.setting.management_fee = item.value;
						break;
					case 'TOTAL_EXTRA_FEE':
						this.setting.total_extra_fee = item.value;
						break;
					case 'EXTRA_COST_FEE':
						this.setting.extra_cost_fee = item.value;
						break;
					case 'MAX_PO_PRICE':
						this.setting.max_po_price = item.value;
						break;
				}
			} );
		} );
	}

	/**
	* Handle file selected event
	* @param {any} event
	* @return {void}
	*/
	public onFileSelected( event: any ) {
		this.selectedFile = <File> event.target.files[ 0 ];

		const fileType: string = this.selectedFile.type;

		if ( !_.contains( CONSTANTS.ALLOW_IMAGE_FILES, fileType ) ) {
			this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_TYPE' );
			return;
		}

		if ( this.selectedFile.size > CONSTANTS.ALLOW_FILE_SIZE ) {
			this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_SIZE' );
			return;
		}

		const myReader: FileReader = new FileReader();

		myReader.onloadend = ( e: any ) => {
			const image: HTMLImageElement = new Image();
			const result: any = e.target.result;
			const cropperImage: HTMLCanvasElement = <HTMLCanvasElement>($( this.elementRef.nativeElement ).find( '#cropper' )[ 0 ]);

			if ( this.cropper ) return;

			this.cropper = new Cropper.default( cropperImage, this.defaultOptions );
			this.cropper.replace( result );

			image.src = result;
			this.previewLogo = image.src;
		};

		myReader.readAsDataURL( this.selectedFile );
	}

	/**
	* Reset logo back to original logo
	* @return {void}
	*/
	public resetLogo() {
		this.resetCropper();
		this.previewLogo = _.clone( this.originalSettings.branch_logo );
		this.newLogoFile = null;
	}

	/**
	* Reset cropper
	* @return {void}
	*/
	public resetCropper() {
		this.selectedFile = null;
		this.cropper = null;
	}

	/**
	* Reset form
	* @return {void}
	*/
	public resetForm() {
		this.setting = this.originalSettings;
		FormService.resetForm( this.settingForm );
	}

	/**
	* Reset setting
	* @return {void}
	*/
	public reset() {
		this.resetLogo();
		this.resetForm();
	}

	/**
	* Change logo
	* @desc Change temp avatar (avatar can be path or file)
	* @return {void}
	*/
	public changeLogo() {
		const imageData: any = this.cropper.getCroppedCanvas({
			width					: this.cropper.getCropBoxData().width || 300,
			height					: this.cropper.getCropBoxData().height || 300,
			imageSmoothingEnabled	: true,
			imageSmoothingQuality	: 'high',
		});

		imageData.toBlob( ( blob: Blob ) => {
			this.previewLogo = imageData.toDataURL( 'image/png' );
			this.newLogoFile = <File> blob;
			this.resetCropper();
		}, 'image/png', .7 );
	}

	/**
	* Upload logo
	* @return {void}
	*/
	public uploadLogo() {
		this.isUploading = true;
		this.setProcessing( true );

		this.settingService
		.uploadLogo( this.newLogoFile )
		.subscribe( ( result: any ) => {
			this.isUploading = false;
			this.setProcessing( false );

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.SETTINGS.MESSAGES.UPDATE_SETTING_FAIL' );
				return;
			}

			this.setting.branch_logo = result.data[ 0 ].location;
			this.updateSettings();
		} );
	}

	/**
	* Update setting
	* @return {void}
	*/
	public updateSettings() {
		this.isUpdating = true;
		this.setProcessing( true );

		this.settingService
		.update([
			{ key: 'BRANCH_LOGO' , value: this.setting.branch_logo },
			{ key: 'BRANCH_PRIMARY_COLOR' , value: this.setting.branch_primary_color },
			{ key: 'BRANCH_SECONDARY_COLOR' , value: this.setting.branch_secondary_color },
			{ key: 'QUOTATION_NOTE' , value: this.setting.quotation_note || null },
			{ key: 'CONTRACT_SIGNER_FULL_NAME' , value: this.setting.contract_signer_full_name || null },
			{ key: 'CONTRACT_SIGNER_TITLE' , value: this.setting.contract_signer_title || null },
			{ key: 'EXCHANGE_RATE' , value: this.setting.exchange_rate || 1 },
			{ key: 'MANAGEMENT_FEE' , value: this.setting.management_fee || 0 },
			{ key: 'TOTAL_EXTRA_FEE' , value: this.setting.total_extra_fee || 0 },
			{ key: 'EXTRA_COST_FEE' , value: this.setting.extra_cost_fee || 0 },
			{ key: 'MAX_PO_PRICE' , value: this.setting.max_po_price || 0 },
		])
		.subscribe( ( result: any ) => {
			this.isUpdating = false;
			this.setProcessing( false );

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.SETTINGS.MESSAGES.UPDATE_SETTING_FAIL' );
				return;
			}

			this.snackBarService.success( 'FINANCE.SETTINGS.MESSAGES.UPDATE_SETTING_SUCCESS' );
		} );
	}

	/**
	* Handle update setting
	* @desc Upload logo before update setting
	* @return {void}
	*/
	public update() {
		// In case upload new logo
		if ( this.newLogoFile ) {
			this.uploadLogo();
			return;
		}

		this.updateSettings();
	}

}
