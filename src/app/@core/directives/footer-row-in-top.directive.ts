import { Directive, ElementRef, AfterViewChecked } from '@angular/core';
import * as _$ from 'jquery';

const $: any = _$;

@Directive({
	selector: '[footerRowInTop]',
})
export class FooterRowInTopDirective implements AfterViewChecked {

	private element: any;

	/**
	* @constructor
	* @param {ElementRef} elementRef
	*/
	constructor( private elementRef: ElementRef ) {
		this.element = $( this.elementRef.nativeElement );
	}

	/**
	* @constructor
	*/
	public ngAfterViewChecked() {
		const table: any = this.element.parent();

		table.find( 'mat-header-row:last' ).after( this.element );
	}

}
