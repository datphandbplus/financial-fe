import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class ProjectPaymentApproverService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Update project payment approve status
	* @param {any} id - project payment id to update
	* @param {any} data - project payment data to update
	* @return {Observable}
	*/
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			status	: data.status,
			comment	: data.comment,
		};

		if ( !isNaN( data.total_real ) && !isNaN( data.total_vat_real ) ) {
			params.total_real = data.total_real;
			params.total_vat_real = data.total_vat_real;
		}

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/update-approve-status/' + id,
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

}
