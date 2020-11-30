import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class LezoClientService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get all Lezo clients
	* @return {Observable}
	*/
	public getAll(): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/api/ext/lezo/lezo-client/list' )
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

}
