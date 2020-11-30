import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class ProjectCostItemService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get project cost items
	* @param {number} projectId
	* @param {string} queryFor
	* @param {any} queryId
	* @return {Observable}
	*/
	public getAll( projectId: number, queryFor?: string, queryId?: any ): Observable<any> {
		const params: any = {};

		if ( projectId ) params.project_id = projectId;
		if ( queryFor ) params.query_for = queryFor;
		if ( queryId && queryId.vendor_id ) params.vendor_id = queryId.vendor_id;
		if ( queryId && queryId.vo_id ) params.vo_id = queryId.vo_id;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-cost-item/list',
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
	* Create project cost item
	* @param {any} data - Project cost item data to create
	* @return {Observable}
	*/
	public create( data: any ): Observable<any> {
		const params: any = {
			project_id				: data.project_id,
			vo_id					: data.vo_id,
			cost_item_category_id	: data.cost_item_category_id,
			name					: data.name,
			unit					: data.unit,
			amount					: +data.amount,
			price					: +data.price,
			vendor_id				: data.vendor_id,
			description				: data.description,
			note					: data.note,
			project_line_item_id	: data.project_line_item_id,
			parent_id				: data.parent_id,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-cost-item/create',
				'POST',
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
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			project_id				: data.project_id,
			vo_id					: data.vo_id,
			cost_item_category_id	: data.cost_item_category_id,
			name					: data.name,
			unit					: data.unit,
			amount					: +data.amount,
			price					: +data.price,
			vendor_id				: data.vendor_id,
			description				: data.description,
			note					: data.note,
			project_line_item_id	: data.project_line_item_id,
			parent_id				: data.parent_id,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-cost-item/update/' + id,
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
	* Update project cost item's vendor
	* @param {number} id - Project cost item id to be updated
	* @param {any} data - Project cost item's vendor id
	* @return {Observable}
	*/
	public updateVendor( id: number, data: any ): Observable<any> {
		const params: any = {
			vendor_id	: data.vendor_id,
			project_id	: data.project_id,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-cost-item/update-vendor/' + id,
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
	* Download template
	* @return {Observable}
	*/
	public download(): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-cost-item/download',
				'GET'
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Upload project cost items file
	* @param {File} file - File to upload
	* @param {any} id - project id to upload
	* @param {string} action
	* @return {Observable}
	*/
	public upload( file: File, id: any, action: string = 'addnew' ): Observable<any> {
		let urlAddedString: string = '?project_id=' + id.project_id;

		if ( action ) urlAddedString += '&action=' + action;
		if ( id.vo_id ) urlAddedString += '&vo_id=' + id.vo_id;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.upload(
				'/api/finance/project-cost-item/upload' + urlAddedString,
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
	* Delete project cost item
	* @param {number} id - Project cost item id to delete
	* @return {Observable}
	*/
	public delete( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-cost-item/delete/' + id,
				'DELETE'
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

}
