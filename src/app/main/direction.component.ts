import _ from 'underscore';

import { AccountService } from './account/services/account.service';

export interface Annotation {
	path: string;
	parent?: any;
	data?: { title?: string, icon?: string };
	priority?: number;
	roles?: Array<string>;
}

export class DirectionComponent {

	public keys: Array<string> = [];
	public directions: any = {};

	/**
	* @constructor
	* @param {any} _directions
	* @param {AccountService} accountService
	*/
	constructor(
		public _directions		: any,
		public accountService	: AccountService
	) {
		_directions = JSON.parse( JSON.stringify( _directions ) );

		_.each( _directions, ( direction: any, key: string ) => {
			if ( direction.roles && !this.accountService.hasRoles( direction.roles ) ) {
				delete _directions[ key ];
			}
		} );

		this.directions = _directions;
		this.keys = this.sort( _.keys( _directions ) );
	}

	/**
	* Sort directions
	* @param {Array} array - Directions
	* @return {Array} array - Sorted directions
	*/
	public sort( array: Array<any> ) {
		array.sort( ( a: any, b: any ) => {
			a = typeof a === 'object' ? a.priority : this.directions[ a ].priority;
			b = typeof b === 'object' ? b.priority : this.directions[ b ].priority;

			const pA: number = !isNaN( a ) ? a : 0;
			const pB: number = !isNaN( b ) ? b : 0;

			return pB - pA;
		} );

		return array;
	}

}
