import { OnDestroy, Injector } from '@angular/core';
import _ from 'underscore';
import moment from 'moment-timezone';

import { AccountService } from '@account/services/account.service';
import { COLORS } from '@resources';
import {
	UtilitiesService, PageService,
	NumberService, DataTableComponent
} from '@core';

export class BaseComponent extends DataTableComponent implements OnDestroy {

	public account: any;
	public sub: any;

	/**
	* @constructor
	* @param {Injector} injector
	*/
	constructor( public injector: Injector ) {
		super( injector );

		const accountService: AccountService = this.injector.get( AccountService );
		this.account = accountService.getStoredProfile();
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		this.destroy();
	}

	/**
	* Destroy component
	* @return {void}
	*/
	public destroy() {
		this.sub && _.isFunction( this.sub.unsubscribe ) && this.sub.unsubscribe();

		if ( !_.isArray( this.sub ) ) return;

		_.each( this.sub, ( sub: any ) => {
			_.isFunction( sub.unsubscribe ) && sub.unsubscribe();
		} );
	}

	/**
	* Get base component property
	* @param {string} propertyName - Property name to get
	* @return {any}
	*/
	public getProperty( propertyName: string ): any {
		return this[ propertyName ];
	}

	/**
	* Get base component method
	* @param {string} methodName - Method name to get
	* @return {Function}
	*/
	public getMethod( methodName: string ): Function {
		return this[ methodName ];
	}

	/**
	* Execute base component method
	* @param {string} methodName - Method name to execute
	* @return {any}
	*/
	public execMethod( methodName: string ): any {
		return this[ methodName ]();
	}

	/**
	* Set processing
	* @param {boolean} isProcessing
	* @return {void}
	*/
	public setProcessing( isProcessing: boolean ) {
		const pageSerivce: PageService = this.injector.get( PageService );
		pageSerivce.setProcessing( isProcessing );
	}

	/**
	* ChartJS options
	* @static
	* @param {any} options
	* @return {any}
	*/
	public chartJSOptions( options?: any ) {
		const datasets: Array<any> = options ? options.datasets : [];
		const toolTipLabel: string = options ? options.tooltipLabel : '';

		options && delete options.datasets;
		options && delete options.tooltipLabel;

		return {
			legend: {
				labels: {
					usePointStyle	: true,
					boxWidth		: 16,
					padding			: 70,
				},
				position: 'bottom',
			},
			layout: {
				padding: { top: 20 },
			},
			tooltips: {
				enabled: false,
				/* tslint:disable-next-line */
				custom( tooltipModel: any ) {
					// Tooltip Element
					let tooltipEl: any = document.getElementById( 'chartjs-tooltip' );

					// Create element on first render
					if ( !tooltipEl ) {
						tooltipEl = document.createElement( 'div' );
						tooltipEl.id = 'chartjs-tooltip';
						document.body.appendChild(tooltipEl);
					}

					// Hide if no tooltip
					if ( !tooltipModel.opacity ) {
						tooltipEl.style.opacity = 0;
						return;
					}

					// Set caret position
					tooltipEl.classList.remove( 'above', 'below', 'no-transform' );

					if ( tooltipModel.yAlign ) {
						tooltipEl.classList.add( tooltipModel.yAlign );
					} else {
						tooltipEl.classList.add( 'no-transform' );
					}

					// Set Text
					if ( tooltipModel.body && datasets ) {
						const index: number = tooltipModel.dataPoints[ 0 ].index;

						tooltipEl.innerHTML = '<b>'
							+ toolTipLabel
							+ ':</b> '
							+ NumberService.addCommas(
								( datasets[ 1 ].data[ index ] ? datasets[ 1 ].data[ index ] : 0 )
									- ( datasets[ 0 ].data[ index ] ? datasets[ 0 ].data[ index ] : 0 )
							);
					}

					// `this` will be the overall tooltip
					const position: any = this._chart.canvas.getBoundingClientRect();

					// Display, position, and set styles for font
					tooltipEl.style.opacity = 1;
					tooltipEl.style.position = 'absolute';
					tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
					tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY - 35 + 'px';
					tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
					tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
					tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
					tooltipEl.style.pointerEvents = 'none';
					tooltipEl.style.zIndex = 1;
					tooltipEl.style.borderRadius = '4px';
					tooltipEl.style.padding = '8px 20px';
					tooltipEl.style.backgroundColor = UtilitiesService.hexToRgba( COLORS.ACCENT, .41 );
				},
			},
			scales: {
				offsetGridLines: true,
				xAxes: [
					{
						maxBarThickness		: 50,
						categoryPercentage	: .5,
						stacked				: true,
						ticks: {
							callback: ( value: string ) => {
								if ( !value ) {
									return '';
								}

								return this.convertLabelToDate(value);
							},
						},
					},
				],
				yAxes: [
					{
						ticks: {
							beginAtZero	: true,
							suggestedMax: 1000000,
							callback	: ( value: number ) => NumberService.addCommas( value ),
						},
					},
				],
			},
			...options,
		};
	}

	private convertLabelToDate(value) {
		const label: Array<string> = value.split( '-' );
		const date: any = moment().year( +label[ 0 ] ).month( +label[ 1 ] - 1 );

		if ( !label[ 2 ] ) return date.format( 'MMMM YYYY' );

		date.week( +label[ 2 ] );

		const startOfWeek: any = date.clone().startOf( 'W' );
		const endOfWeek: any = date.clone().endOf( 'W' );
		let format: string = startOfWeek.format( 'DD' );

		if ( startOfWeek.month() !== endOfWeek.month() ) {
			format = startOfWeek.year() === endOfWeek.year()
				? startOfWeek.format( 'DD MMM' )
				: startOfWeek.format( 'DD MMM YYYY' );
		}

		format += ' - ' + endOfWeek.format( 'DD MMM YYYY' );

		return format;
	}

	/**
	* ChartJS label key
	* @param {number} year
	* @param {number} month
	* @param {number} week
	* @return {string}
	*/
	public chartJSLabelKey( year: number, month: number, week: number ) {
		if ( week ) {
			if ( month === 12 && week === 1 ) {
				year++;
				month = 1;
			}

			const date: any = moment().year( year ).month( month - 1 ).week( week );
			const monthOfStartfWeek: any = date.clone().startOf( 'W' ).month();
			const monthOfEndWeek: any = date.clone().endOf( 'W' ).month();

			monthOfStartfWeek !== monthOfEndWeek && ( month = monthOfEndWeek + 1 );
		}

		return [
			NumberService.addZero( year ),
			NumberService.addZero( month ),
			...( week ? [ NumberService.addZero( week ) ] : null ),
		].join( '-' );
	}

	/**
	* ChartJS label key for RRP
	* @param {number} year
	* @param {number} month
	* @param {number} week
	* @return {string}
	*/
	public chartJSLabelKeyRRP( year: number, month: number, week: number ) {
		if ( week ) {
			if ( month === 12 && week === 1 ) {
				year++;
				month = 1;
			}

			const date: any = moment().clone().year( year ).month( month - 1 ).week( week );
			const monthOfStartfWeek: any = date.clone().startOf( 'W' ).month();
			const monthOfEndWeek: any = date.clone().endOf( 'W' ).month();

			monthOfStartfWeek !== monthOfEndWeek && ( month = monthOfEndWeek + 1 );
		}

		const currentYear: number = moment().clone().year();
		const currentMonth: number = moment().clone().month() + 1;
		const currentWeek: number = moment().clone().week();

		const isSameYearAndMonth: boolean = year === currentYear && ( ( month - 1 ) <= currentMonth );

		if ( ( year < currentYear ) || isSameYearAndMonth ) {

			const labelKey: Array<any> = [
				NumberService.addZero( currentYear ),
				NumberService.addZero( currentMonth ),
			];

			week
				? isSameYearAndMonth
					? labelKey.push( [ NumberService.addZero( week ) ] )
					: labelKey.push( [ NumberService.addZero( currentWeek ) ] )
				: labelKey.push( null );

			return labelKey.join( '-' );
		}

		return [
			NumberService.addZero( year ),
			NumberService.addZero( month ),
			...( week ? [ NumberService.addZero( week ) ] : null ),
		].join( '-' );
	}

	public hiddenLabels(labels, currentDateLabelKey , length = 10) {
		if (labels.length < length) {
			return labels;
		}

		let is_hidden = 0;

		labels = _.map(labels, ( item: any, key: number ) => {
			let value = '';
			if (key === 0 || key === is_hidden || item === currentDateLabelKey || labels.length === key + 1) {
				is_hidden = is_hidden + 3;
				value = item;
			}

			return value;
		});

		return labels;
	}

}
