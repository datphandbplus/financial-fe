import { Injectable } from '@angular/core';
import { Observable, Observer, ReplaySubject } from 'rxjs';
import _ from 'underscore';
import * as CryptoJS from 'crypto-js';

import { ApiService, StoreService } from '@core';
import { AuthService } from '@auth/services/auth.service';
import { HASH } from '@environments/hash';

@Injectable()
export class AccountService {

	private storedProfileChange: ReplaySubject<any> = new ReplaySubject<any>();
	private storedProfile: any;

	/**
	* @constructor
	* @param {ApiService} apiService
	* @param {AuthService} authService
	* @param {StoreService} storeService
	*/
	constructor(
		private apiService	: ApiService,
		private authService	: AuthService,
		private storeService: StoreService
		// private serviceWorkerService: ServiceWorkerService
	) {}

	/* Account Methods */

	/**
	* Get user account
	* @return {Observable}
	*/
	public getProfile(): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/api/user/account' )
			.subscribe(
				( result: any ) => {
					this.storedProfile = result;
					this.storedProfileChange.next( this.storedProfile );
					observer.next( result );
				},
				( error: any ) => observer.error( error )
			);
		} );
	}

	/**
	* Upload account avatar
	* @param {File} file - Avatar file to upload
	* @return {boolean}
	*/
	public uploadAvatar( file: File ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.upload(
				'/api/user/account/upload-avatar',
				file
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Update account avatar
	* @param {string} avatar - Avatar path to update
	* @return {boolean}
	*/
	public updateAvatar( avatar: string ): Observable<any> {
		const params: any = { avatar };
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/user/account/update-avatar',
				'PUT',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Change user password
	* @param {string} currentPassword
	* @param {string} newPassword
	* @return {Observable}
	*/
	public changePassword( currentPassword: string, newPassword: string ) {
		const params: any = {
			current_password: CryptoJS.AES
				.encrypt( currentPassword, HASH.PASSWORD_HASH_KEY )
				.toString(),
			new_password: CryptoJS.AES
				.encrypt( newPassword, HASH.PASSWORD_HASH_KEY )
				.toString(),
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/user/account/change-password',
				'PUT',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Logout
	* @return {Observable}
	*/
	public logout(): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			// Remove stored auth
			this.authService.removeStoredAuth();
			this.apiService.removeStoredAuth();

			// Remove stored account
			this.removeStoredProfile();

			// Remove all cookies
			this.storeService.removeAll();

			// Disable service worker push notification
			// this.serviceWorkerService.disablePushNotification();

			observer.next( {} );
		} );
	}

	/**
	* Detect profile change
	* @return {ReplaySubject}
	*/
	public detectProfileChanged(): ReplaySubject<any> {
		if ( !this.storedProfile && this.authService.isAuthorized() ) {
			this.getProfile().subscribe();
		}

		return this.storedProfileChange;
	}

	/**
	* Get stored profile in cookie
	* @param {boolean} isAsynchronous - Flag to get asynchronous stored profile
	* @return {Observable}
	*/
	public getStoredProfile( isAsynchronous: boolean = false ): any {
		if ( !isAsynchronous ) {
			return this.storedProfile;
		}

		return new Observable( ( observer: Observer<any> ) => {
			if ( this.storedProfile ) {
				observer.next( this.storedProfile );
				return;
			}

			return this.getProfile().subscribe();
		} );
	}

	/**
	* Remove stored profile in cookie
	* @return {Observable}
	*/
	public removeStoredProfile() {
		this.storedProfile = null;
		this.storedProfileChange.next( this.storedProfile );
	}

	/* General Methods */

	/**
	* Check current user is super admin
	* @return {boolean}
	*/
	public isSuperAdmin(): boolean {
		return this.isCEO()
			&& this.storedProfile
			&& this.storedProfile.is_owner;
	}

	/**
	* Check current user is CEO
	* @return {boolean}
	*/
	public isCEO(): boolean {
		return this.hasRole( 'CEO' );
	}

	/**
	* Check current user is Admin
	* @return {boolean}
	*/
	public isAdmin(): boolean {
		return this.hasRole( 'ADMIN' );
	}

	/**
	* Check current user is CFO
	* @return {boolean}
	*/
	public isCFO(): boolean {
		return this.hasRole( 'CFO' );
	}

	/**
	* Check current user is General Accountant
	* @return {boolean}
	*/
	public isGeneralAccountant(): boolean {
		return this.hasRole( 'GENERAL_ACCOUNTANT' );
	}

	/**
	* Check current user is Liabilities Accountant
	* @return {boolean}
	*/
	public isLiabilitiesAccountant(): boolean {
		return this.hasRole( 'LIABILITIES_ACCOUNTANT' );
	}

	/**
	* Check current user is PM
	* @return {boolean}
	*/
	public isPM(): boolean {
		return this.hasRole( 'PM' );
	}

	/**
	* Check current user is Sale
	* @return {boolean}
	*/
	public isSale(): boolean {
		return this.hasRole( 'SALE' );
	}

	/**
	* Check current user is Procurement Manager
	* @return {boolean}
	*/
	public isProcurementManager(): boolean {
		return this.hasRole( 'PROCUREMENT_MANAGER' );
	}

	/**
	* Check current user is QS
	* @return {boolean}
	*/
	public isQS(): boolean {
		return this.hasRole( 'QS' );
	}

	/**
	* Check current user is Purchasing
	* @return {boolean}
	*/
	public isPurchasing(): boolean {
		return this.hasRole( 'PURCHASING' );
	}

	/**
	* Check current user is Construction Manager
	* @return {boolean}
	*/
	public isConstructionManager(): boolean {
		return this.hasRole( 'CONSTRUCTION_MANAGER' );
	}

	/**
	* Check current user is Construction
	* @return {boolean}
	*/
	public isConstruction(): boolean {
		return this.hasRole( 'CONSTRUCTION' );
	}

	/**
	* Check current user is finance
	* @return {boolean}
	*/
	public isFinance(): boolean {
		return this.hasRole( 'FINANCE' );
	}

	/**
	* Check current user has group
	* @param {string} roleKey - Role key to check
	* @return {boolean}
	*/
	public hasRole( roleKey: string ): boolean {
		return this.storedProfile && this.storedProfile.role_key === roleKey;
	}

	/**
	* Check current user has groups
	* @param {array} roleKeys - Role keys to check
	* @return {boolean}
	*/
	public hasRoles( roleKeys: Array<string> ): boolean {
		return this.storedProfile
			&& this.storedProfile.role_key
			&& _.include( roleKeys, this.storedProfile.role_key );
	}

	/**
	* Check has Lezo app
	* @return {boolean}
	*/
	public hasLezoApp(): boolean {
		return this.storedProfile
			&& this.storedProfile.available_apps
			&& this.storedProfile.available_apps.length
			&& _.include( this.storedProfile.available_apps, 'lezo' );
	}

}
