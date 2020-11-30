import { Injectable } from '@angular/core';
import { Observable, Observer, ReplaySubject } from 'rxjs';
import * as CryptoJS from 'crypto-js';

import { ApiService, StoreService } from '@core';
import { HASH } from '@environments/hash';

@Injectable()
export class AuthService {

	private storedAuthChange: ReplaySubject<any> = new ReplaySubject<any>();
	private storedAuth: any;

	/**
	* @constructor
	* @param {ApiService} apiService
	* @param {StoreService} storeService
	*/
	constructor(
		private apiService	: ApiService,
		private storeService: StoreService
		// private serviceWorkerService: ServiceWorkerService
	) {}

	/**
	* Check channel
	* @param {string} channelId - Channel id to check
	* @return {Observable}
	*/
	public checkChannel( channelId: string ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/auth/channel/check/' + channelId )
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Login
	* @param {any} user - User to login
	* @param {any} channel - Channel to login
	* @return {Observable}
	*/
	public login( user: any, channel: any ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			const data: any = {
				email: user.email,
				password: CryptoJS.AES
					.encrypt( user.password, HASH.PASSWORD_HASH_KEY )
					.toString(),
			};
			const headers: any = {
				'x-channel-id'		: channel.id,
				'x-channel-token'	: channel.token,
			};

			this.apiService
			.call(
				'/auth/session/login',
				'POST',
				data,
				headers
			)
			.subscribe(
				( result: any ) => {
					if ( result.status ) {
						// Store authentication data
						this.storeService.set( HASH.AUTHORIZED_KEY, result.data );
						this.apiService.setStoredAuth( result.data );

						// Enable service worker push notification
						// this.serviceWorkerService.enablePushNotification();
					}

					this.storedAuth = result.data;
					this.storedAuthChange.next( this.storedAuth );
					observer.next( result );
				},
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Forgot password
	* @param {any} user - User to forgot password
	* @param {any} channel - Channel to forgot password
	* @return {Observable}
	*/
	public forgotPassword( user: any, channel: any ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			const data: any = { email: user.email };
			const headers: any = {
				'x-channel-id'		: channel.id,
				'x-channel-token'	: channel.token,
			};

			this.apiService
			.call(
				'/auth/session/forgot-password',
				'POST',
				data,
				headers
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Check activate token
	* @param {string} token - Activate Token
	* @return {Observable}
	*/
	public checkActivateToken( token: string ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/auth/activate/check?token=' + encodeURIComponent( token ) )
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Activate user
	* @param {any} user - User to activate
	* @param {string} token - Activate Token
	* @return {Observable}
	*/
	public activate( user: any, token: string ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			const data: any = {
				password: CryptoJS.AES
					.encrypt( user.password, HASH.PASSWORD_HASH_KEY )
					.toString(),
			};

			this.apiService
			.call(
				'/auth/activate/account?token=' + encodeURIComponent( token ),
				'POST',
				data
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Reset password
	* @param {any} user - User to activate
	* @param {string} token - Reset Password Token
	* @return {Observable}
	*/
	public resetPassword( user: any, token: string ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			const data: any = {
				password: CryptoJS.AES
					.encrypt( user.password, HASH.PASSWORD_HASH_KEY )
					.toString(),
			};

			this.apiService
			.call(
				'/auth/activate/reset-password?token=' + encodeURIComponent( token ),
				'POST',
				data
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Detect stored authentication changed
	* @return {ReplaySubject}
	*/
	public detectAuthChanged(): ReplaySubject<any> {
		if ( !this.storedAuth ) {
			this.storedAuth = this.storeService.get( HASH.AUTHORIZED_KEY );
			this.storedAuthChange.next( this.storedAuth );
		}

		return this.storedAuthChange;
	}

	/**
	* Get stored authentication
	* @return {any}
	*/
	public getStoredAuth(): any {
		if ( !this.storedAuth ) {
			this.storedAuth = this.storeService.get( HASH.AUTHORIZED_KEY );
		}

		return this.storedAuth;
	}

	/**
	* Remove stored authentication
	* @return {void}
	*/
	public removeStoredAuth() {
		this.storedAuth = null;
		this.storedAuthChange.next( this.storedAuth );
	}

	/**
	* Check is authorized
	* @return {boolean}
	*/
	public isAuthorized(): boolean {
		return !!this.getStoredAuth();
	}

}
