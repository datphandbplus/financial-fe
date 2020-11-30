import {
	OnInit, OnDestroy, Injector,
	Component, ElementRef,
	AfterViewInit, ViewEncapsulation
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';
import * as $ from 'jquery';
import * as Cropper from 'cropperjs';

import { BootstrapComponent } from '@app/bootstrap.component';
import { AccountService } from '@account/services/account.service';
import { CONSTANTS } from '@resources';
import { EqualValidatorDirective, FormService } from '@core';

@Component({
	selector		: 'account-settings',
	templateUrl		: '../templates/account-settings.pug',
	styleUrls		: [ '../styles/account-settings.scss' ],
	host			: { class: 'layout-column flex-noshrink' },
	encapsulation	: ViewEncapsulation.None,
})
export class AccountSettingsComponent extends BootstrapComponent implements OnInit, OnDestroy, AfterViewInit {

	public cropper: any;
	public passwordForm: FormGroup;
	public selectedFile: File;
	public newAvatarFile: File;
	public newAvatar: string;
	public updateAccount: any;
	public originalAvatar: string;
	public isUploading: boolean;
	public isSubmitting: boolean;
	public isUpdating: boolean;
	public hasChangeAvatar: boolean;
	public CONSTANTS: any = CONSTANTS;
	public password: any = {};
	public defaultOptions: any = {
		aspectRatio		: 1 / 1,
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
	* @param {AccountService} accountService
	* @param {SnackBarService} snackBarService
	* @param {ElementRef} elementRef
	* @param {FormBuilder} fb
	*/
	constructor(
		public injector			: Injector,
		public accountService	: AccountService,
		public snackBarService	: SnackBarService,
		public elementRef		: ElementRef,
		public fb				: FormBuilder
	) {
		super( injector );

		this.passwordForm = fb.group(
			{
				current_password: [
					{ value: null, disabled: false },
					Validators.compose([
						Validators.required,
						Validators.minLength( 8 ),
						Validators.maxLength( 255 ),
					]),
				],
				new_password: [
					{ value: null, disabled: false },
					Validators.compose([
						Validators.required,
						Validators.minLength( 8 ),
						Validators.maxLength( 255 ),
					]),
				],
				confirm_new_password: [
					{ value: null, disabled: false },
					Validators.compose([
						Validators.required,
						Validators.minLength( 8 ),
						Validators.maxLength( 255 ),
					]),
				],
			},
			{ validator: EqualValidatorDirective.MatchPassword }
		);
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		super.ngOnInit();

		this.accountService
		.detectProfileChanged()
		.subscribe( () => {
			this.updateAccount = _.clone( this.account );
			this.originalAvatar = this.updateAccount.avatar
				|| ( this.updateAccount.lezo_employee ? this.updateAccount.lezo_employee.avatar : null );
		} );
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		super.ngOnDestroy();
	}

	/**
	* @constructor
	*/
	public ngAfterViewInit() {
		super.ngAfterViewInit();
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
			this.updateAccount.avatar = image.src;
		};

		myReader.readAsDataURL( this.selectedFile );
	}

	/**
	* Update account settings
	* @desc Update avatar & password
	* @return {void}
	*/
	public updateAccountSettings() {
		this.newAvatarFile && this.uploadAvatar();
		this.newAvatar && this.updateAvatar();
		this.passwordForm.valid && this.changePassword();
	}

	/**
	* Change avatar
	* @desc Change temp avatar (avatar can be path or file)
	* @param {string} avatar - Avatar path to change
	* @return {void}
	*/
	public changeAvatar( avatar?: string ) {
		if ( avatar ) {
			this.updateAccount.avatar = avatar;
			this.newAvatar = avatar;
			this.newAvatarFile = null;
			return;
		}

		const imageData: any = this.cropper.getCroppedCanvas({
			width					: this.cropper.getCropBoxData().width || 300,
			height					: this.cropper.getCropBoxData().height || 300,
			imageSmoothingEnabled	: true,
			imageSmoothingQuality	: 'high',
		});

		imageData.toBlob( ( blob: Blob ) => {
			this.updateAccount.avatar = imageData.toDataURL( 'image/png' );
			this.newAvatarFile = <File> blob;
			this.newAvatar = null;
			this.resetCropper();
		}, 'image/png', .7 );
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
	* Reset avatar back to original avatar
	* @return {void}
	*/
	public resetAvatar() {
		this.resetCropper();
		this.updateAccount.avatar = _.clone( this.originalAvatar );
		this.newAvatarFile = null;
		this.newAvatar = null;
	}

	/**
	* Reset password form
	* @return {void}
	*/
	public resetPasswordForm() {
		this.password = {};
		FormService.resetForm( this.passwordForm );
	}

	/**
	* Reset account settings
	* @return {void}
	*/
	public resetAccountSettings() {
		this.resetAvatar();
		this.resetPasswordForm();
	}

	/**
	* Change password
	* @return {void}
	*/
	public changePassword() {
		this.isSubmitting = true;

		this.accountService
		.changePassword(
			this.password.current_password,
			this.password.new_password
		)
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'CURRENT_PASSWORD_INVALID' ) {
					this.snackBarService.warning( 'ACCOUNT.MESSAGES.CURRENT_PASSWORD_INVALID' );
					return;
				}

				this.snackBarService.warn( 'ACCOUNT.MESSAGES.CHANGE_PASSWORD_FAIL' );
				return;
			}

			this.snackBarService.success( 'ACCOUNT.MESSAGES.CHANGE_PASSWORD_SUCCESS' );

			this.resetPasswordForm();
		} );
	}

	/**
	* Upload avatar file
	* @return {void}
	*/
	public uploadAvatar() {
		this.isUploading = true;

		this.accountService
		.uploadAvatar( <File> this.newAvatarFile )
		.subscribe( ( result: any ) => {
			this.isUploading = false;
			this.resetCropper();

			if ( !result || !result.status ) {
				if ( result && result.message === 'INVALID_FILE_TYPE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_TYPE' );
					return;
				}

				if ( result && result.message === 'INVALID_FILE_SIZE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_SIZE' );
					return;
				}

				this.snackBarService.warn( 'ACCOUNT.MESSAGES.UPDATE_AVATAR_FAIL' );
				return;
			}

			this.snackBarService.success( 'ACCOUNT.MESSAGES.UPDATE_AVATAR_SUCCESS' );

			this.originalAvatar = _.clone( this.updateAccount.avatar );
			this.account.avatar = _.clone( this.updateAccount.avatar );
			this.resetAvatar();
		} );
	}

	/**
	* Update avatar path
	* @return {void}
	*/
	public updateAvatar() {
		this.isUpdating = true;

		this.accountService
		.updateAvatar( this.newAvatar )
		.subscribe( ( result: any ) => {
			this.isUpdating = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'ACCOUNT.MESSAGES.UPDATE_AVATAR_FAIL' );
				return;
			}

			this.snackBarService.success( 'ACCOUNT.MESSAGES.UPDATE_AVATAR_SUCCESS' );

			this.originalAvatar = _.clone( this.updateAccount.avatar );
			this.account.avatar = _.clone( this.updateAccount.avatar );
			this.resetAvatar();
		} );
	}

}
