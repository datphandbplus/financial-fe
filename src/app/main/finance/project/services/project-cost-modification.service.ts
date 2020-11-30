import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class ProjectCostModificationService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get project cost items
	* @param {number} projectId - Project id
	* @return {Observable}
	*/
	public getAll( projectId?: number ): Observable<any> {
		const params: any = {};

		if ( projectId ) params.project_id = projectId;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-cost-modification/list',
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
	* Update project cost item
	* @param {number} id - Project cost item id to be updated
	* @param {any} data - Project cost item data to update
	* @return {Observable}
	*/
	public modifyCost( id: number, data: any ): Observable<any> {
		const params: any = {
			project_id				: data.project_id,
			cost_item_category_id	: data.cost_item_category_id,
			name					: data.name,
			unit					: data.unit,
			amount					: +data.amount,
			price					: +data.price,
			vendor_id				: data.vendor_id,
			description				: data.description,
			note					: data.note,
			project_line_item_id	: data.project_line_item_id,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-cost-modification/modify-cost/' + id,
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
	* Update project status
	* @param {any} id - project id to update
	* @param {any} data - project data to update
	* @return {Observable}
	*/
	public updateStatus( id: number, data: any ): Observable<any> {
		const params: any = { status: data.status };

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-cost-modification/update-status/' + id,
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
