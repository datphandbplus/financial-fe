import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
// Start temp fix
import _ from 'underscore';
// End temp fix

import { ApiService } from '@core';

@Injectable()
export class PayableService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get all payables
	* @param {any} invoiceDateStart
	* @param {any} invoiceDateEnd
	* @return {Observable}
	*/
	public getAll( invoiceDateStart: any, invoiceDateEnd: any ): Observable<any> {
		const params: any = {
			invoice_date_start	: invoiceDateStart,
			invoice_date_end	: invoiceDateEnd,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/payables',
				'GET',
				params
			)
			.subscribe(
				// Start temp fix
				( result: any ) => {
					result = _.map( result, ( item: any ) => {
						item.invoice = item.invoices && item.invoices.length ? item.invoices[ 0 ].location : null;
						item.payment_order = item.payment_orders && item.payment_orders.length ? item.payment_orders[ 0 ].location : null;
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
