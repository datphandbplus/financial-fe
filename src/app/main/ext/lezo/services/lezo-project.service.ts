import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class LezoProjectService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get all Lezo projects
	* @return {Observable}
	*/
	public getAll(): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/api/ext/lezo/lezo-project/list' )
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

}
