import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class SettingService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get all keys
	* @param {Array} keys
	* @return {Observable}
	*/
	public getAll( keys?: Array<string> ): Observable<any> {
		const params: any = {};

		if ( keys ) params.keys = keys;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/setting/list',
				'GET',
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
	* Update keys
	* @param {Array} keys
	* @return {Observable}
	*/
	public update( keys: Array<any> ): Observable<any> {
		const params: any = keys;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/setting/update',
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
	* Upload logo
	* @param {File} file - Logo file to upload
	* @return {boolean}
	*/
	public uploadLogo( file: File ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.upload(
				'/api/finance/setting/upload-logo',
				file
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

}
