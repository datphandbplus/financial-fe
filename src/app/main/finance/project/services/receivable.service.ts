import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
// Start temp fix
import _ from 'underscore';
// End temp fix

import { ApiService } from '@core';

@Injectable()
export class ReceivableService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get all receivables
	* @param {any} expectedInvoiceDateStart
	* @param {any} expectedInvoiceDateEnd
	* @return {Observable}
	*/
	public getAll( expectedInvoiceDateStart: any, expectedInvoiceDateEnd: any ): Observable<any> {
		const params: any = {
			expected_invoice_date_start	: expectedInvoiceDateStart,
			expected_invoice_date_end	: expectedInvoiceDateEnd,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/receivables',
				'GET',
				params
			)
			.subscribe(
				// Start temp fix
				( result: any ) => {
					result = _.map( result, ( item: any ) => {
						item.invoice = item.invoices && item.invoices.length ? item.invoices[ 0 ].location : null;
						return item;
					} );

					observer.next( result );
				},
				// ( result: any ) => observer.next( result ),
				// End temp fix
				( error: any ) => observer.error( error )
			);
		} );
	}

}
