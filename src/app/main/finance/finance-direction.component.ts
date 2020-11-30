import { Component } from '@angular/core';
import _ from 'underscore';

import { AccountService } from '@account/services/account.service';
import { DirectionComponent, Annotation } from '@main/direction.component';

const directions: any = {};

export function Direction( annotation: Annotation ) {
	function f( _target: Function ) {
		if ( annotation.parent ) {
			if ( typeof annotation.parent === 'object' ) {
				const parent: any = annotation.parent;

				annotation.parent = annotation.parent.name;

				// Declare blank parent direction
				if (!directions[ annotation.parent ]) {
					directions[ annotation.parent ] = parent;
				} else {
					directions[ annotation.parent ] = _.assign( {}, parent, directions[ annotation.parent ] );
				}
			}

			// In case parent direction is not exists then declare itself
			if (! directions[ annotation.parent ] ) {
				directions[ annotation.parent ] = {};
			}

			// In case parent direction has not any child then declare children array
			if ( !directions[ annotation.parent ].children ) {
				directions[ annotation.parent ].children = [];
			}

			// Add child to parent
			directions[ annotation.parent ].children.push( annotation );
		} else {
			directions[ annotation.path ] = _.assign( {}, directions[ annotation.path ], annotation );
		}
	}

	return f;
}

@Component({
	selector	: 'finance-direction',
	templateUrl	: '../../../templates/finance-direction.pug',
	host		: { class: 'layout-column flex-noshrink' },
})
export class FinanceDirectionComponent extends DirectionComponent {

	/**
	* @constructor
	* @param {AccountService} accountService
	*/
	constructor( public accountService: AccountService ) {
		super( directions, accountService );
	}

}
