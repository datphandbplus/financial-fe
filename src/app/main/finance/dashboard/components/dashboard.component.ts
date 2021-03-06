import {
	OnInit, OnDestroy,
	Component, Injector
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment-timezone';
import _ from 'underscore';
import 'chartjs-plugin-annotation';
import * as $ from 'jquery';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { Direction } from '@finance/finance-direction.component';
import { ProjectService } from '@finance/project/services/project.service';
import { COLORS } from '@resources';
import { UtilitiesService, NumberService } from '@core';
import {VOService} from "@finance/project/services/vo.service";
import {ProjectCostItemService} from "@finance/project/services/project-cost-item.service";

@Component({
	selector	: 'dashboard',
	templateUrl	: '../templates/dashboard.pug',
	styleUrls	: [ '../styles/dashboard.scss' ],
})
@Direction({
	path	: 'dashboard',
	data	: { title: 'FINANCE.DIRECTION.DASHBOARD', icon: 'icon icon-dashboard' },
	priority: 100,
	roles: [
		'CEO', 'CFO', 'GENERAL_ACCOUNTANT',
		'LIABILITIES_ACCOUNTANT', 'PROCUREMENT_MANAGER', 'CONSTRUCTION_MANAGER',
		'PM', 'SALE',
		'QS', 'PURCHASING',
	],
})
export class DashboardComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public loaded: boolean;
	public currentDate: any = moment();
	public clients: Array<any> = [];
	public projects: Array<any> = [];

	public filteredProjects: Array<any> = [];
	public customDatasets: Array<any> = [];
	public chartLabels: Array<string> = [];
	public chartOptions: any = this.chartJSOptions();
	public chartColors: Array<any> = [];
	public chartDatasets: Array<any> = [
		{ data: [] },
		{ data: [] },
	];
	public filters: any = {
		date: {
			begin	: this.currentDate.clone().startOf( 'Y' ),
			end		: this.currentDate.clone().endOf( 'Y' ),
		},
		type		: 'month',
		project_ids	: [],
		client_ids	: [],
	};
	public REAL_AND_PLAN: string = 'real_and_plan';
	public REAL_ONLY: string = 'real_only';
	public chartViewType: string = this.REAL_AND_PLAN; // or real_only
	public rrpCustomDatasets: Array<any> = [];
	public rrpChartLabels: Array<string> = [];
	public rrpChartOptions: any = this.chartJSOptions();
	public rrpChartColors: Array<any> = [];
	public rrpChartDatasets: Array<any> = [
		{ data: [] },
		{ data: [] },
		{ data: [] },
	];

	public columnChartSettings: any = {
		options: {
			scales: {
				xAxes: [{ stacked: false }],
				yAxes: [
					{
						stacked: true,
						ticks: {
							callback: function (value) {
								return NumberService.addCommas(value.toFixed(0))
							}
						}
					}
				]
			},
			legend: {
				display: false
			},
			tooltips: {
				mode: 'label',
				callbacks: {
					label: (tooltipItem, _data) => {
						return [NumberService.addCommas(+tooltipItem.value)];
					}
				}
			},
		},
		labels: ['Total Line', 'Total Bill'],
		datasets: [
			{
				label: '',
				data: [1, 1],
				backgroundColor: ['rgb(83,184,35)', '#fd8631']
			}
		],
		colors: ['#00ADF9']
	};

	/**
	* @constructor
	* @param {Injector} injector
	* @param {ProjectService} projectService
	* @param {TranslateService} translateService
	*/
	constructor(
		public injector				  : Injector,
		public projectService		  : ProjectService,
		public voService			  : VOService,
		public projectCostItemService : ProjectCostItemService,
		public translateService		  : TranslateService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.initData();
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		super.ngOnDestroy();
	}

	/**
	* Init all data
	* @return {void}
	*/
	public initData() {
		this.getProjectStatistic();
		this.getProjectStatisticRRP();
		this.getProjects();
	}

	/**
	* Handle client change event
	* @return {void}
	*/
	public onClientChange() {
		this.filteredProjects = this.filters.client_ids && this.filters.client_ids.length
			? _.filter( this.projects, ( project: any ) => _.contains( this.filters.client_ids, project.client_id ) )
			: [];
		this.getColumnChartData();
		this.filters.project_ids = _.map( this.filteredProjects, 'id' );
	}

	/**
	* Get projects
	* @return {void}
	*/
	public getProjects() {
		this.projectService
		.getAll( 'dashboard_reference' )
		.subscribe( ( result: any ) => {
			const projects: any = result;
			const clients: any = [];

			_.each( result, ( item: any ) => {
				if ( !item.client || _.findWhere( clients, { id: item.client.id } ) ) return;
				clients.push( item.client );
			} );

			this.clients = clients;
			this.projects = projects;
			this.filters.client_ids = _.map( clients, 'id' );
			this.onClientChange();
		} );
	}

	private processItemTotal(item) {
		const result = {
			total_bill: 0,
			total_line: 0
		};
		let totalBill: number = 0;
		_.each( item.project_bills, ( bill: any ) => {
			totalBill += bill.total_real + bill.total_vat_real;
		} );
		result.total_bill = totalBill;
		const total = item.project_sheets.map(v => v.project_line_items);
		let totalLineSub = 0;
		total.forEach(t1 => {
			t1.forEach(t2 => {
				totalLineSub += t2.total || 0;
			});
		});
		result.total_line = totalLineSub * 1.1;

		return result;
	}

	private calculateTotal(data) {
		const _this = this;
		const result = {
			totalLine: 0,
			totalBill: 0
		};
		_.map( data, ( item: any ) => {
			item = _this.processItemTotal(item);

			result.totalLine += item.total_line;
			result.totalBill += item.total_bill;
		} );
		return result;
	}

	public getColumnChartData() {
		const projects = this.filters.client_ids && this.filters.client_ids.length
			? _.filter( this.projects, ( project: any ) => _.contains( this.filters.client_ids, project.client_id ) )
			: [];
		const totalData = this.calculateTotal(projects);
		this.columnChartSettings.datasets[0].data = [totalData.totalLine, totalData.totalBill];
	}

	/**
	* Get project statistic
	* @return {void}
	*/
	public getProjectStatistic() {
		this.chartLabels = [];
		this.chartDatasets[ 0 ].data = [];
		this.chartDatasets[ 1 ].data = [];
		this.customDatasets[ 1 ] = { data: [] }; // Plan
		this.customDatasets[ 0 ] = { data: [] }; // Real;

		if ( !this.filters.project_ids || !this.filters.project_ids.length ) return;

		this.loaded = false;
		this.setProcessing( true );

		this.projectService
		.getDashboardStatistic(
			this.filters.date.begin, this.filters.date.end, this.filters.type,
			this.filters.project_ids, 'dashboard_reference'
		).subscribe( ( result: any ) => {
			this.loaded = true;
			this.setProcessing( false );
			this.chartViewType === this.REAL_AND_PLAN
				? this.calcualateRealAndPlan( result )
				: this.calcualateRealOnly( result );
		} );
	}

	/**
	* Get project statistic receivable and receivable plan
	* @return {void}
	*/
	public getProjectStatisticRRP() {
		this.rrpChartLabels = [];
		this.rrpChartDatasets[ 0 ].data = []; // Receivable
		this.rrpChartDatasets[ 1 ].data = []; // Payable
		this.rrpChartDatasets[ 2 ].data = []; // Receivable Plan
		this.rrpCustomDatasets[ 0 ] = {
			data		: [],
			income		: 0,
			cost		: 0,
			income_plan	: 0,
		}; // Receivable
		this.rrpCustomDatasets[ 1 ] = {
			data		: [],
			income		: 0,
			cost		: 0,
			income_plan	: 0,
		}; // Payable
		this.rrpCustomDatasets[ 2 ] = {
			data		: [],
			income		: 0,
			cost		: 0,
			income_plan	: 0,
		}; // Receivable Plan

		if ( !this.filters.project_ids || !this.filters.project_ids.length ) return;

		this.loaded = false;
		this.setProcessing( true );

		this.projectService
		.getDashboardStatisticRRP(
			this.filters.date.begin, this.filters.date.end, this.filters.type,
			this.filters.project_ids, 'dashboard_reference'
		).subscribe( ( result: any ) => {
			this.loaded = true;
			this.setProcessing( false );

			this.calcualateRealAndReceivablePlan( result );
		} );
	}

	/**
	* Chart view change
	* @param {any} event
	* @return {void}
	*/
	public chartViewChange( event: any ) {
		if ( !event || !event.source ) return;

		this.getProjectStatistic();
	}

	/**
	* Calcualte real and plan
	* @param {any} result
	* @return {void}
	*/
	public calcualateRealAndPlan( result: any ) {
		this.chartColors = [
			{
				borderColor			: UtilitiesService.hexToRgba( COLORS.WARNING, .9 ),
				backgroundColor		: 'rgba( 0, 0, 0, 0 )',
				pointBorderWidth	: 3,
				pointBackgroundColor: UtilitiesService.hexToRgba( COLORS.WARNING, .9 ),
			},
			{
				borderColor			: UtilitiesService.hexToRgba( COLORS.SUCCESS, .9 ),
				backgroundColor		: 'rgba( 0, 0, 0, 0 )',
				pointBorderWidth	: 3,
				pointBackgroundColor: UtilitiesService.hexToRgba( COLORS.SUCCESS, .9 ),
			},
		];
		this.chartDatasets = [
			{ label: this.translateService.instant( 'FINANCE.PROJECT.LABELS.REAL' ), data: [], pointRadius: [] },
			{ label: this.translateService.instant( 'FINANCE.PROJECT.LABELS.PLAN' ), data: [], pointRadius: [] },
		];

		const sheets: any = {};
		const labels: Array<string> = [];
		const projectTotalLine: any = {};
		const projectTotalCost: any = {};
		let totalRevenue: number = 0;
		let totalRevenuePlan: number = 0;

		_.each( result.total_line, ( item: any ) => projectTotalLine[ item.project_id ] = item.total );

		_.each( result.total_cost, ( item: any ) => projectTotalCost[ item.project_id ] = item.total );

		_.each( result.income, ( item: any ) => {
			const key: string = this.chartJSLabelKey( item.year, item.month, item.week );

			if ( !sheets[ key ] ) sheets[ key ] = { income: 0, cost: 0, income_plan: 0, cost_plan: 0 };

			sheets[ key ].income += item.final_total + item.final_total_vat;
			!_.include( labels, key ) && labels.push( key );
		} );

		_.each( result.cost, ( item: any ) => {
			const key: string = this.chartJSLabelKey( item.year, item.month, item.week );

			if ( !sheets[ key ] ) sheets[ key ] = { income: 0, cost: 0, income_plan: 0, cost_plan: 0 };

			sheets[ key ].cost += item.final_total + item.final_total_vat;
			!_.include( labels, key ) && labels.push( key );
		} );

		_.each( result.income_plan, ( item: any ) => {
			const key: string = this.chartJSLabelKey( item.year, item.month, item.week );

			if ( !sheets[ key ] ) sheets[ key ] = { income: 0, cost: 0, income_plan: 0, cost_plan: 0 };

			sheets[ key ].income_plan += ( item.target_percent || 0 ) * ( projectTotalLine[ item.project_id ] || 0 ) / 100;
			!_.include( labels, key ) && labels.push( key );
		} );

		_.each( result.cost_plan, ( item: any ) => {
			const key: string = this.chartJSLabelKey( item.year, item.month, item.week );

			if ( !sheets[ key ] ) sheets[ key ] = { income: 0, cost: 0, income_plan: 0, cost_plan: 0 };

			sheets[ key ].cost_plan += ( item.target_percent || 0 ) * ( projectTotalCost[ item.project_id ] || 0 ) / 100;
			!_.include( labels, key ) && labels.push( key );
		} );

		if ( !labels || !labels.length ) return;

		const currentDateLabelKey: string = this.chartJSLabelKey(
			this.currentDate.year(),
			this.currentDate.month() + 1,
			this.filters.type === 'month' ? null : this.currentDate.week()
		);


		!_.include( labels, currentDateLabelKey ) && labels.push( currentDateLabelKey );

		_.each( labels.sort(), ( label: any, index: number ) => {
			let sheet: any = sheets[ label ];

			if ( !sheet ) {
				sheet = sheets[ labels[ index - 1 ] ];

				if ( !sheet ) return;

				// Real
				this.chartDatasets[ 0 ].data.push( sheet.revenue || 0 );
				this.customDatasets[ 0 ].data.push( { income: sheet.income || 0, cost: sheet.cost || 0, date: label } );

				// Plan
				this.chartDatasets[ 1 ].data.push( sheet.revenue_plan || 0 );
				this.customDatasets[ 1 ].data.push( { income: sheet.income_plan || 0, cost: sheet.cost_plan || 0, date: label } );
				return;
			}

			// Real
			totalRevenue += ( sheet.income || 0 ) - ( sheet.cost || 0 );
			sheet.revenue = _.clone( totalRevenue );
			this.chartDatasets[ 0 ].data.push( sheet.revenue || 0 );
			this.customDatasets[ 0 ].data.push( { income: sheet.income || 0, cost: sheet.cost || 0, date: label } );

			// Plan
			totalRevenuePlan += ( sheet.income_plan || 0 ) - ( sheet.cost_plan || 0 );
			sheet.revenue_plan = _.clone( totalRevenuePlan );
			this.chartDatasets[ 1 ].data.push( sheet.revenue_plan || 0 );
			this.customDatasets[ 1 ].data.push( { income: sheet.income_plan || 0, cost: sheet.cost_plan || 0, date: label } );
		} );
		const currentDateLabelIndex: number = _.indexOf( labels, currentDateLabelKey );
		let xAdjust: number = 0;

		if ( currentDateLabelIndex === 0 ) xAdjust = 50;
		if ( currentDateLabelIndex === ( labels.length - 1 ) ) xAdjust = -50;
		this.chartLabels = this.hiddenLabels(labels, currentDateLabelKey);
		const _this: any = this;
		this.chartDatasets[0].pointRadius = this.processChartData(this.chartDatasets[0], this.customDatasets[0]);
		this.chartDatasets[1].pointRadius = this.processChartData(this.chartDatasets[1], this.customDatasets[1]);

		this.chartOptions = this.chartJSOptions({
			legend: {
				reverse: true,
				position: 'bottom',
				labels: {
					usePointStyle: true
				}
			},
			datasets: this.chartDatasets,
			tooltipLabel: this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL'),
			annotation: {
				annotations: [
					{
						value: currentDateLabelKey,
						drawTime: 'afterDatasetsDraw',
						type: 'line',
						mode: 'vertical',
						scaleID: 'x-axis-0',
						borderColor: 'red',
						borderWidth: 3,
						label: {
							xAdjust,
							enabled: true,
							position: 'center',
							content: this.translateService.instant(
								this.filters.type === 'month' ? 'GENERAL.LABELS.CURRENT_MONTH' : 'GENERAL.LABELS.CURRENT_WEEK'
							),
						},
					},
				],
			},
			tooltips: {
				enabled: false,
				intersect: false,
				/* tslint:disable-next-line */
				custom(tooltipModel: any) {
					let tooltipEl: any = document.getElementById('chartjs-tooltip');

					// Create element on first render
					if (!tooltipEl) {
						tooltipEl = document.createElement('div');
						tooltipEl.id = 'chartjs-tooltip';
						document.body.appendChild(tooltipEl);
					}

					// Hide if no tooltip
					if (!tooltipModel.opacity) {
						tooltipEl.style.opacity = 0;
						$('.chartjs-tooltip').css({opacity: 0});
						return;
					}

					// Set caret position
					tooltipEl.classList.remove('above', 'below', 'no-transform');

					if (tooltipModel.yAlign) {
						tooltipEl.classList.add(tooltipModel.yAlign);
					} else {
						tooltipEl.classList.add('no-transform');
					}

					let revenue: number = 0;

					// Set Text
					let isShowTooltip = false;
					if (tooltipModel.body && _this.chartDatasets) {
						const index: number = tooltipModel.dataPoints[0].index;
						const datasetIndex: number = tooltipModel.dataPoints[0].datasetIndex;

						revenue = _this.chartDatasets[datasetIndex].data[index]
							? _this.chartDatasets[datasetIndex].data[index]
							: 0;

						tooltipEl.innerHTML = '<b>' + _this.translateService.instant('FINANCE.PROJECT.LABELS.INCOME') + ':</b> '
							+ (_this.customDatasets[datasetIndex].data[index].income
								? NumberService.addCommas(_this.customDatasets[datasetIndex].data[index].income)
								: 0)
							+ '<br/><b>' + _this.translateService.instant('FINANCE.PROJECT.LABELS.COST') + ':</b> '
							+ (_this.customDatasets[datasetIndex].data[index].cost
								? NumberService.addCommas(_this.customDatasets[datasetIndex].data[index].cost)
								: 0)
							+ '<br/><b>' + _this.translateService.instant('FINANCE.PROJECT.LABELS.REVENUE') + ':</b> '
							+ NumberService.addCommas(revenue)
							+ '<br/><b>' + _this.translateService.instant('FINANCE.PROJECT.LABELS.DATE') + ':</b> '
							+ _this.convertLabelToDate(_this.customDatasets[datasetIndex].data[index].date);


						if (_this.customDatasets[datasetIndex].data[index].income === 0 && _this.customDatasets[datasetIndex].data[index].cost === 0) {
							isShowTooltip = true;
						}

					}

					// `this` will be the overall tooltip
					const position: any = this._chart.canvas.getBoundingClientRect();


					// Display, position, and set styles for font
					tooltipEl.style.opacity = 1;
					tooltipEl.style.position = 'absolute';
					tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX
						+ (tooltipEl.offsetLeft > position.width / 2 ? -tooltipEl.offsetWidth : 0) + 'px';
					tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY - 60 + 'px';
					tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
					tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
					tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
					tooltipEl.style.pointerEvents = 'none';
					tooltipEl.style.zIndex = 1;
					tooltipEl.style.borderRadius = '4px';
					tooltipEl.style.padding = '8px 20px';
					tooltipEl.style.backgroundColor = revenue >= 0
						? UtilitiesService.hexToRgba(COLORS.ACCENT, .41)
						: UtilitiesService.hexToRgba(COLORS.WARN, .41);

					if (isShowTooltip) tooltipEl.style.opacity = 0;

					// Real data fake point
					let realPointEl: any = document.getElementById('tooltip-point');

					if (!realPointEl) {
						realPointEl = document.createElement('div');
						realPointEl.id = 'tooltip-point';
						realPointEl.classList.add('chartjs-tooltip');
						document.body.appendChild(realPointEl);
					}
					if (!isShowTooltip) {
						realPointEl.innerHTML = '<div style="width: 10px; height: 10px; border: 1px none; position: absolute; background-color:'
							+ UtilitiesService.hexToRgba(COLORS.ACCENT, .9)
							+ '; left: ' + (tooltipModel.dataPoints[0].x + 120) + 'px'
							+ '; top: ' + (tooltipModel.dataPoints[0].y + position.top + window.pageYOffset - 5) + 'px'
							+ '; border-radius: 50%;"></div>';

						realPointEl.style.opacity = 1;
						realPointEl.style.zIndex = 1;
					}
				},
			},
		});
		//

	}

	/**
	* Calcualte real only
	* @param {any} result
	* @return {void}
	*/
	public calcualateRealOnly( result: any ) {
		this.chartColors = [
			{
				borderColor			: UtilitiesService.hexToRgba( COLORS.WARNING, .9 ),
				backgroundColor		: 'rgba( 0, 0, 0, 0 )',
				pointBorderWidth	: 3,
				pointBackgroundColor: UtilitiesService.hexToRgba( COLORS.WARNING, .9 ),
			},
			{
				borderColor			: UtilitiesService.hexToRgba( COLORS.SUCCESS, .9 ),
				backgroundColor		: 'rgba( 0, 0, 0, 0 )',
				pointBorderWidth	: 3,
				pointBackgroundColor: UtilitiesService.hexToRgba( COLORS.SUCCESS, .9 ),
			},
		];
		this.chartDatasets = [
			{ label: this.translateService.instant( 'FINANCE.PROJECT.LABELS.PAYABLES' ), data: [] },
			{ label: this.translateService.instant( 'FINANCE.PROJECT.LABELS.RECEIVABLES' ), data: [] },
		];

		const sheets: any = {};
		const labels: Array<string> = [];
		const projectTotalLine: any = {};
		const projectTotalCost: any = {};
		let totalPayable: number = 0;
		let totalBill: number = 0;

		_.each( result.total_line, ( item: any ) => projectTotalLine[ item.project_id ] = item.total );

		_.each( result.total_cost, ( item: any ) => projectTotalCost[ item.project_id ] = item.total );

		_.each( result.income, ( item: any ) => {
			const key: string = this.chartJSLabelKey( item.year, item.month, item.week );

			if ( !sheets[ key ] ) sheets[ key ] = { income: 0, cost: 0 };

			sheets[ key ].income = item.final_total + item.final_total_vat;
			!_.include( labels, key ) && labels.push( key );
		} );

		_.each( result.cost, ( item: any ) => {
			const key: string = this.chartJSLabelKey( item.year, item.month, item.week );

			if ( !sheets[ key ] ) sheets[ key ] = { income: 0, cost: 0 };

			sheets[ key ].cost = item.final_total + item.final_total_vat;
			!_.include( labels, key ) && labels.push( key );
		} );

		if ( !labels || !labels.length ) return;

		const currentDateLabelKey: string = this.chartJSLabelKey(
			this.currentDate.year(),
			this.currentDate.month() + 1,
			this.filters.type === 'week' ? this.currentDate.week() : null
		);

		!_.include( labels, currentDateLabelKey ) && labels.push( currentDateLabelKey );

		_.each( labels.sort(), ( label: any, index: number ) => {
			let sheet: any = sheets[ label ];

			if ( !sheet ) {
				sheet = sheets[ labels[ index - 1 ] ];

				if ( !sheet ) return;

				// Payable
				this.chartDatasets[ 0 ].data.push( totalPayable || 0 );
				this.customDatasets[ 0 ].data.push({
					income	: sheet.income || 0,
					cost	: sheet.cost || 0,
					payable	: _.clone( totalPayable ),
					date    : label
				});

				// Receivable
				this.chartDatasets[ 1 ].data.push( totalBill || 0 );
				this.customDatasets[ 1 ].data.push({
					income		: sheet.income || 0,
					cost		: sheet.cost || 0,
					receivable	: _.clone( totalBill ),
					date   		: label
				});
				return;
			}

			// Payable
			totalPayable += sheet.cost || 0;
			sheet.payable = _.clone( totalPayable );
			this.chartDatasets[ 0 ].data.push( sheet.payable || 0 );
			this.customDatasets[ 0 ].data.push({
				income	: sheet.income || 0,
				cost	: sheet.cost || 0,
				payable	: _.clone( totalPayable ),
				date    : label
			});

			// Receivable
			totalBill += sheet.income || 0;
			sheet.receivable = _.clone( totalBill );
			this.chartDatasets[ 1 ].data.push( sheet.receivable || 0 );
			this.customDatasets[ 1 ].data.push({
				income		: sheet.income || 0,
				cost		: sheet.cost || 0,
				receivable	: _.clone( totalBill ),
				date   		: label
			});
		} );
		const currentDateLabelIndex: number = _.indexOf( labels, currentDateLabelKey );
		let xAdjust: number = 0;

		if ( currentDateLabelIndex === 0 ) xAdjust = 50;
		if ( currentDateLabelIndex === ( labels.length - 1 ) ) xAdjust = -50;

		this.chartLabels = this.hiddenLabels(labels, currentDateLabelKey);
		const _this: any = this;
		this.chartDatasets[0].pointRadius = this.processChartData(this.chartDatasets[0], this.customDatasets[0]);
		this.chartDatasets[1].pointRadius = this.processChartData(this.chartDatasets[1], this.customDatasets[1]);

		this.chartOptions = this.chartJSOptions({
			datasets: this.chartDatasets,
			tooltipLabel: this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL'),
			annotation: {
				annotations: [
					{
						value: currentDateLabelKey,
						drawTime: 'afterDatasetsDraw',
						type: 'line',
						mode: 'vertical',
						scaleID: 'x-axis-0',
						borderColor: 'red',
						borderWidth: 3,
						label: {
							xAdjust,
							enabled: true,
							position: 'center',
							content: this.translateService.instant(
								this.filters.type === 'week' ? 'GENERAL.LABELS.CURRENT_WEEK' : 'GENERAL.LABELS.CURRENT_MONTH'
							),
						},
					},
				],
			},
			tooltips: {
				enabled: false,
				intersect: false,
				/* tslint:disable-next-line */
				custom(tooltipModel: any) {
					// Tooltip Element
					let tooltipEl: any = document.getElementById('chartjs-tooltip');

					// Create element on first render
					if (!tooltipEl) {
						tooltipEl = document.createElement('div');
						tooltipEl.id = 'chartjs-tooltip';
						document.body.appendChild(tooltipEl);
					}

					// Hide if no tooltip
					if (!tooltipModel.opacity) {
						tooltipEl.style.opacity = 0;
						$('.chartjs-tooltip').css({opacity: 0});
						return;
					}

					// Set caret position
					tooltipEl.classList.remove('above', 'below', 'no-transform');

					if (tooltipModel.yAlign) {
						tooltipEl.classList.add(tooltipModel.yAlign);
					} else {
						tooltipEl.classList.add('no-transform');
					}

					// Set Text
					let isShowTooltip = false;
					if (tooltipModel.body && _this.chartDatasets) {
						const index: number = tooltipModel.dataPoints[0].index;
						const datasetIndex: number = tooltipModel.dataPoints[0].datasetIndex;


						if (datasetIndex === 1 && _this.customDatasets[datasetIndex].data[index].income === 0) {
							isShowTooltip = true;
						}

						if (datasetIndex === 0 && _this.customDatasets[datasetIndex].data[index].cost === 0) {
							isShowTooltip = true;
						}

						tooltipEl.innerHTML = datasetIndex
							? ('<b>' + _this.translateService.instant('FINANCE.PROJECT.LABELS.INCOME') + ':</b> '
								+ (_this.customDatasets[datasetIndex].data[index].income
									? NumberService.addCommas(_this.customDatasets[datasetIndex].data[index].income)
									: 0)
								+ '<br/><b>' + _this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL') + ':</b> '
								+ (_this.customDatasets[datasetIndex].data[index].receivable
									? NumberService.addCommas(_this.customDatasets[datasetIndex].data[index].receivable)
									: 0))
							: ('<b>' + _this.translateService.instant('FINANCE.PROJECT.LABELS.COST') + ':</b> '
							+ (_this.customDatasets[datasetIndex].data[index].cost
								? NumberService.addCommas(_this.customDatasets[datasetIndex].data[index].cost)
								: 0)
							+ '<br/><b>' + _this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL') + ':</b> '
							+ (_this.customDatasets[datasetIndex].data[index].payable
								? NumberService.addCommas(_this.customDatasets[datasetIndex].data[index].payable)
								: 0))
							+ '<br/><b>' + _this.translateService.instant('FINANCE.PROJECT.LABELS.DATE') + ':</b> '
							+ _this.convertLabelToDate(_this.customDatasets[datasetIndex].data[index].date);

					}

					// `this` will be the overall tooltip
					const position: any = this._chart.canvas.getBoundingClientRect();

					// Display, position, and set styles for font
					tooltipEl.style.opacity = 1;
					tooltipEl.style.position = 'absolute';
					tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX
						+ (tooltipEl.offsetLeft > position.width / 2 ? -tooltipEl.offsetWidth : 0) + 'px';
					tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY - 60 + 'px';
					tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
					tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
					tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
					tooltipEl.style.pointerEvents = 'none';
					tooltipEl.style.zIndex = 1;
					tooltipEl.style.borderRadius = '4px';
					tooltipEl.style.padding = '8px 20px';

					if (isShowTooltip) tooltipEl.style.opacity = 0;

					tooltipEl.style.backgroundColor = UtilitiesService.hexToRgba(COLORS.ACCENT, .41);

					// Real data fake point
					let realPointEl: any = document.getElementById('tooltip-point');

					if (!realPointEl) {
						realPointEl = document.createElement('div');
						realPointEl.id = 'tooltip-point';
						realPointEl.classList.add('chartjs-tooltip');
						document.body.appendChild(realPointEl);
					}

					if (!isShowTooltip) {
						realPointEl.innerHTML = '<div style="width: 10px; height: 10px; border: 1px none; position: absolute; background-color:'
							+ UtilitiesService.hexToRgba(COLORS.ACCENT, .9)
							+ '; left: ' + (tooltipModel.dataPoints[0].x + 120) + 'px'
							+ '; top: ' + (tooltipModel.dataPoints[0].y + position.top + window.pageYOffset - 5) + 'px'
							+ '; border-radius: 50%;"></div>';

						realPointEl.style.opacity = 1;
						realPointEl.style.zIndex = 1;
					}
				},
			},
		});
	}

	/**
	* Calcualte real and receivable plan
	* @param {any} result
	* @return {void}
	*/
	public calcualateRealAndReceivablePlan( result: any ) {
		this.rrpChartColors = [
			{
				borderColor: UtilitiesService.hexToRgba(COLORS.ACCENT, .9),
				backgroundColor: 'rgba( 0, 0, 0, 0 )',
				pointBorderWidth: 3,
				pointBackgroundColor: UtilitiesService.hexToRgba(COLORS.ACCENT, .9),
			},
			{
				borderColor: UtilitiesService.hexToRgba(COLORS.SUCCESS, .9),
				backgroundColor: 'rgba( 0, 0, 0, 0 )',
				pointBorderWidth: 3,
				pointBackgroundColor: UtilitiesService.hexToRgba(COLORS.SUCCESS, .9),
			},
			{
				borderColor: UtilitiesService.hexToRgba(COLORS.WARN, .9),
				backgroundColor: 'rgba( 0, 0, 0, 0 )',
				pointBorderWidth: 3,
				pointBackgroundColor: UtilitiesService.hexToRgba(COLORS.WARN, .9),
			},
		];
		this.rrpChartDatasets = [
			{label: this.translateService.instant('FINANCE.PROJECT.LABELS.RECEIVABLES_PLAN'), data: [], pointRadius: []},
			{label: this.translateService.instant('FINANCE.PROJECT.LABELS.RECEIVABLES'), data: [], pointRadius: []},
			{label: this.translateService.instant('FINANCE.PROJECT.LABELS.PAYABLES'), data: [], pointRadius: []},
		];

		const sheets: any = {};
		const labels: Array<string> = [];
		const projectTotalLine: any = {};
		let totalIncome: number = 0;
		let totalCost: number = 0;
		let totalIncomePlan: number = 0;

		_.each( result.total_line, ( item: any ) => projectTotalLine[ item.project_id ] = item.total );

		_.each( result.income_plan, ( item: any ) => {
			const key: string = this.chartJSLabelKey( item.year, item.month, item.week );

			if ( !sheets[ key ] ) sheets[ key ] = { income: 0, cost: 0, income_plan: 0 };

			sheets[ key ].income_plan += ( item.target_percent || 0 ) * ( projectTotalLine[ item.project_id ] || 0 ) / 100;
			!_.include( labels, key ) && labels.push( key );
		} );

		_.each( result.income, ( item: any ) => {
			const key: string = this.chartJSLabelKey( item.year, item.month, item.week );

			if ( !sheets[ key ] ) sheets[ key ] = { income: 0, cost: 0, income_plan: 0 };

			sheets[ key ].income += item.final_total + item.final_total_vat;
			!_.include( labels, key ) && labels.push( key );
		} );

		_.each( result.cost, ( item: any ) => {
			const key: string = this.chartJSLabelKey( item.year, item.month, item.week );

			if ( !sheets[ key ] ) sheets[ key ] = { income: 0, cost: 0, income_plan: 0 };

			sheets[ key ].cost += item.final_total + item.final_total_vat;
			!_.include( labels, key ) && labels.push( key );
		} );

		if ( !labels || !labels.length ) return;

		const currentDateLabelKey: string = this.chartJSLabelKey(
			this.currentDate.year(),
			this.currentDate.month() + 1,
			this.filters.type === 'week' ? this.currentDate.week() : null
		);

		!_.include( labels, currentDateLabelKey ) && labels.push( currentDateLabelKey );

		_.each( labels.sort(), ( label: any, index: number ) => {
			let sheet: any = sheets[ label ];

			if ( !sheet ) {
				sheet = sheets[ labels[ index - 1 ] ];

				if ( !sheet ) return;

				// Receivable Plan
				this.rrpChartDatasets[ 2 ].data.push( sheet.income_plan || 0 );
				this.rrpCustomDatasets[ 2 ].data.push( { income: sheet.income || 0, cost: sheet.cost || 0, income_plan: sheet.income_plan || 0, date: label } );

				// Receivable
				this.rrpChartDatasets[ 0 ].data.push( sheet.income || 0 );
				this.rrpCustomDatasets[ 0 ].data.push( { income: sheet.income || 0, cost: sheet.cost || 0, income_plan: sheet.income_plan || 0, date: label } );

				// Payable
				this.rrpChartDatasets[ 1 ].data.push( sheet.cost || 0 );
				this.rrpCustomDatasets[ 1 ].data.push( { income: sheet.income || 0, cost: sheet.cost || 0, income_plan: sheet.income_plan || 0, date: label } );
				return;
			}

			// Receivable Plan
			totalIncomePlan += sheet.income_plan || 0;
			sheet.income_plan = _.clone( totalIncomePlan );
			this.rrpChartDatasets[ 0 ].data.push( sheet.income_plan || 0 );
			this.rrpCustomDatasets[ 0 ].data.push( { income: sheet.income || 0, cost: sheet.cost || 0, income_plan: sheet.income_plan || 0, date: label } );
			this.rrpCustomDatasets[ 0 ].income += sheet.income || 0;
			this.rrpCustomDatasets[ 0 ].cost += sheet.cost || 0;
			this.rrpCustomDatasets[ 0 ].income_plan += sheet.income_plan || 0;

			// Receivable
			totalIncome += sheet.income || 0;
			sheet.income = _.clone( totalIncome );
			this.rrpChartDatasets[ 1 ].data.push( sheet.income || 0 );
			this.rrpCustomDatasets[ 1 ].data.push( { income: sheet.income || 0, cost: sheet.cost || 0, income_plan: sheet.income_plan || 0, date: label } );
			this.rrpCustomDatasets[ 1 ].income += sheet.income || 0;
			this.rrpCustomDatasets[ 1 ].cost += sheet.cost || 0;
			this.rrpCustomDatasets[ 1 ].income_plan += sheet.income_plan || 0;

			// Payable
			totalCost += sheet.cost || 0;
			sheet.cost = _.clone( totalCost );
			this.rrpChartDatasets[ 2 ].data.push( sheet.cost || 0 );
			this.rrpCustomDatasets[ 2 ].data.push( { income: sheet.income || 0, cost: sheet.cost || 0, income_plan: sheet.income_plan || 0, date: label } );
			this.rrpCustomDatasets[ 2 ].income += sheet.income || 0;
			this.rrpCustomDatasets[ 2 ].cost += sheet.cost || 0;
			this.rrpCustomDatasets[ 2 ].income_plan += sheet.income_plan || 0;
		} );

		const _this: any = this;
		const currentDateLabelIndex: number = _.indexOf(labels, currentDateLabelKey);
		let xAdjust: number = 0;

		if (currentDateLabelIndex === 0) xAdjust = 50;
		if (currentDateLabelIndex === (labels.length - 1)) xAdjust = -50;

		this.rrpChartLabels = this.hiddenLabels(labels, currentDateLabelKey);
		this.rrpChartDatasets[0].pointRadius = this.processChartDataRRP(this.rrpChartDatasets[0], this.rrpCustomDatasets[0], 0); // blue
		this.rrpChartDatasets[1].pointRadius = this.processChartDataRRP(this.rrpChartDatasets[1], this.rrpCustomDatasets[1], 1); // green
		this.rrpChartDatasets[2].pointRadius = this.processChartDataRRP(this.rrpChartDatasets[2], this.rrpCustomDatasets[2], 2); // red

		this.rrpChartOptions = this.chartJSOptions({
			datasets: this.rrpChartDatasets,
			tooltipLabel: this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL'),
			annotation: {
				annotations: [
					{
						value: currentDateLabelKey,
						drawTime: 'afterDatasetsDraw',
						type: 'line',
						mode: 'vertical',
						scaleID: 'x-axis-0',
						borderColor: 'red',
						borderWidth: 3,
						label: {
							xAdjust,
							enabled: true,
							position: 'center',
							content: this.translateService.instant(
								this.filters.type === 'week' ? 'GENERAL.LABELS.CURRENT_WEEK' : 'GENERAL.LABELS.CURRENT_MONTH'
							),
						},
					},
				],
			},
			tooltips: {
				enabled: false,
				mode: 'index',
				intersect: false,
				/* tslint:disable-next-line */
				custom(tooltipModel: any) {
					// Hide if no tooltip
					if (!tooltipModel.opacity) {
						$('.chartjs-tooltip').css({opacity: 0});
						return;
					}

					// Set Text
					if (tooltipModel.body && _this.rrpChartDatasets) {
						let dataPoints: Array<any> = tooltipModel.dataPoints;
						const pointIndexs = _.map(dataPoints, 'datasetIndex');

						if (dataPoints.length < 3) {
							if (!pointIndexs.includes(0)) {
								dataPoints.push({
									datasetIndex: 0,
									status: 0,
									index: dataPoints[0].index,
									label: dataPoints[0].label,
									value: '',
									x: 0,
									xLabel: '',
									y: 0,
									yLabel: 0,
								});
							}
							if (!pointIndexs.includes(1)) {
								dataPoints.push({
									datasetIndex: 1,
									status: 0,
									index: dataPoints[0].index,
									label: dataPoints[0].label,
									value: '',
									x: 0,
									xLabel: '',
									y: 0,
									yLabel: 0,
								});
							}
							if (!pointIndexs.includes(2)) {
								dataPoints.push({
									datasetIndex: 2,
									status: 0,
									index: dataPoints[0].index,
									label: dataPoints[0].label,
									value: '',
									x: 0,
									xLabel: '',
									y: 0,
									yLabel: 0,
								});
							}
						}

						dataPoints = dataPoints.sort(function (a, b) {
							return a.datasetIndex - b.datasetIndex;
						});


						// `this` will be the overall tooltip
						const position: any = this._chart.canvas.getBoundingClientRect();

						// Prevent tootip overlap
						const posArr: Array<any> = [
							{position: (dataPoints[0] && dataPoints[0].y) || 0, index: 0},
							{position: (dataPoints[1] && dataPoints[1].y) || 0, index: 1},
							{position: (dataPoints[2] && dataPoints[2].y) || 0, index: 2},
						];

						const newPos: Array<number> = [
							(dataPoints[0] && dataPoints[0].y) || 0,
							(dataPoints[1] && dataPoints[1].y) || 0,
							(dataPoints[2] && dataPoints[2].y) || 0,
						];

						posArr.sort((a: any, b: any) => {
							return b.position > a.position ? 1 : -1;
						});

						if (posArr[0].position - newPos[posArr[1].index] < 68) {
							newPos[posArr[1].index] -= 68;
						}

						if (newPos[posArr[1].index] - newPos[posArr[2].index] < 68) {
							newPos[posArr[2].index] = newPos[posArr[1].index] - 68;
						}
						let cost;
						let costAfter;

						// Receivable Plan tooltip
						let receivablePlanTooltipEl: any = document.getElementById('tooltip-' + dataPoints[0].datasetIndex);
						if(dataPoints[0] &&  dataPoints[0].status != 0 && _this.rrpChartDatasets[0].pointRadius[dataPoints[0].index]){
							if (!receivablePlanTooltipEl) {
								receivablePlanTooltipEl = document.createElement('div');
								receivablePlanTooltipEl.id = 'tooltip-' + dataPoints[0].datasetIndex;
								receivablePlanTooltipEl.classList.add('chartjs-tooltip');
								document.body.appendChild(receivablePlanTooltipEl);
							}

							cost = _this.rrpCustomDatasets[dataPoints[0].datasetIndex].data[dataPoints[0].index].income_plan
								? NumberService.addCommas(_this.rrpCustomDatasets[dataPoints[0].datasetIndex].data[dataPoints[0].index].income_plan)
								: 0;

							costAfter = NumberService.addCommas(
								(
									_this.rrpCustomDatasets[dataPoints[0].datasetIndex].data[dataPoints[0].index] &&
									_this.rrpCustomDatasets[dataPoints[0].datasetIndex].data[dataPoints[0].index].income_plan ?
										_this.rrpCustomDatasets[dataPoints[0].datasetIndex].data[dataPoints[0].index].income_plan : 0
								) -
								(
									_this.rrpCustomDatasets[dataPoints[0].datasetIndex].data[dataPoints[0].index - 1] &&
									_this.rrpCustomDatasets[dataPoints[0].datasetIndex].data[dataPoints[0].index - 1].income_plan ?
										_this.rrpCustomDatasets[dataPoints[0].datasetIndex].data[dataPoints[0].index - 1].income_plan : 0
								)
							);


							// tslint:disable-next-line:max-line-length
							receivablePlanTooltipEl.innerHTML = 'Date: ' + _this.convertLabelToDate(_this.rrpCustomDatasets[dataPoints[0].datasetIndex].data[dataPoints[0].index].date) +
								'<br/><strong>Income: ' + cost + '</strong><br/><strong style="color: dodgerblue">+ ' + costAfter + '</strong>'
							;

							if (+costAfter !== 0) receivablePlanTooltipEl.style.opacity = 1;
							receivablePlanTooltipEl.style.position = 'absolute';
							receivablePlanTooltipEl.style.top = newPos[0] + position.top + window.pageYOffset - 45 + 'px';
							receivablePlanTooltipEl.style.left = dataPoints[0].x + 125
								+ (receivablePlanTooltipEl.offsetLeft > position.width / 2 ? -receivablePlanTooltipEl.offsetWidth : 0) + 'px';
							receivablePlanTooltipEl.style.zIndex = 1;
							receivablePlanTooltipEl.style.borderRadius = '4px';
							receivablePlanTooltipEl.style.borderColor = UtilitiesService.hexToRgba(COLORS.ACCENT, .41);
							receivablePlanTooltipEl.style.borderStyle = 'solid';
							receivablePlanTooltipEl.style.padding = '8px 20px';
							receivablePlanTooltipEl.style.backgroundColor = UtilitiesService.hexToRgba(COLORS.WHITE);

						} else {
							if (receivablePlanTooltipEl) {
								receivablePlanTooltipEl.style.opacity = 0;
							}
						}

						// Receivable tooltip
						let receivableTooltipEl: any = document.getElementById('tooltip-' + dataPoints[1].datasetIndex);
						if(dataPoints[1] && dataPoints[1].datasetIndex && dataPoints[1].status !== 0 &&
							_this.rrpChartDatasets[1].pointRadius[dataPoints[1].index]){
							if (!receivableTooltipEl) {
								receivableTooltipEl = document.createElement('div');
								receivableTooltipEl.id = 'tooltip-' + dataPoints[1].datasetIndex;
								receivableTooltipEl.classList.add('chartjs-tooltip');
								document.body.appendChild(receivableTooltipEl);
							}

							cost = (_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index] &&
								_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index].income)
								? NumberService.addCommas(_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index].income)
								: 0;
							costAfter = NumberService.addCommas(
								(
									(
										_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index] &&
										_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index].income) ?
										_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index].income : 0
								) -
								(
									_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index - 1] &&
									_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index - 1].income ?
										_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index - 1].income : 0
								)
							);
							// tslint:disable-next-line:max-line-length
							receivableTooltipEl.innerHTML = 'Date: ' +
								(
									_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index] ?
										_this.convertLabelToDate(_this.rrpCustomDatasets[dataPoints[1].datasetIndex].data[dataPoints[1].index].date) : ''
								) +
								'<br/><strong>Income: ' + cost + '</strong><br/><strong style="color: green">+ ' + costAfter + '</strong>';

							if (+costAfter !== 0) receivableTooltipEl.style.opacity = 1;
							receivableTooltipEl.style.position = 'absolute';
							receivableTooltipEl.style.top = newPos[1] + position.top + window.pageYOffset - 45 + 'px';
							receivableTooltipEl.style.left = dataPoints[1].x + 125
								+ (receivableTooltipEl.offsetLeft > position.width / 2 ? -receivableTooltipEl.offsetWidth : 0) + 'px';
							receivableTooltipEl.style.zIndex = 1;
							receivableTooltipEl.style.borderRadius = '4px';
							receivableTooltipEl.style.borderColor = UtilitiesService.hexToRgba(COLORS.SUCCESS, .41);
							receivableTooltipEl.style.borderStyle = 'solid';
							receivableTooltipEl.style.padding = '8px 20px';
							receivableTooltipEl.style.backgroundColor = UtilitiesService.hexToRgba(COLORS.WHITE);
						} else {
							if (receivableTooltipEl) {
								receivableTooltipEl.style.opacity = 0;
							}
						}

						// Payable tooltip
						let payableTooltipEl: any = document.getElementById('tooltip-' + dataPoints[2].datasetIndex);
						if (dataPoints[1] && dataPoints[1].datasetIndex && dataPoints[2] && dataPoints[2].datasetIndex &&
							dataPoints[2].status !== 0 && _this.rrpChartDatasets[2].pointRadius[dataPoints[2].index]) {
							if (!payableTooltipEl) {
								payableTooltipEl = document.createElement('div');
								payableTooltipEl.id = 'tooltip-' + dataPoints[2].datasetIndex;
								payableTooltipEl.classList.add('chartjs-tooltip');
								document.body.appendChild(payableTooltipEl);
							}

							cost = _this.rrpCustomDatasets[dataPoints[2].datasetIndex].data[dataPoints[2].index].cost
								? NumberService.addCommas(_this.rrpCustomDatasets[dataPoints[2].datasetIndex].data[dataPoints[2].index].cost)
								: 0;

							costAfter = NumberService.addCommas(
								(
									_this.rrpCustomDatasets[dataPoints[2].datasetIndex].data[dataPoints[2].index] &&
									_this.rrpCustomDatasets[dataPoints[2].datasetIndex].data[dataPoints[2].index].cost ?
										_this.rrpCustomDatasets[dataPoints[2].datasetIndex].data[dataPoints[2].index].cost : 0
								) -
								(
									_this.rrpCustomDatasets[dataPoints[2].datasetIndex].data[dataPoints[2].index - 1] &&
									_this.rrpCustomDatasets[dataPoints[2].datasetIndex].data[dataPoints[2].index - 1].cost ?
										_this.rrpCustomDatasets[dataPoints[2].datasetIndex].data[dataPoints[2].index - 1].cost : 0)
							);

							// tslint:disable-next-line:max-line-length
							payableTooltipEl.innerHTML = 'Date: ' + _this.convertLabelToDate(_this.rrpCustomDatasets[dataPoints[2].datasetIndex].data[dataPoints[2].index].date) +
								'<br /> <strong>Cost: ' + cost + '</strong><br/><strong style="color: red">+ ' + costAfter + '</strong>'
							;

							if (+costAfter !== 0) payableTooltipEl.style.opacity = 1;
							payableTooltipEl.style.position = 'absolute';
							payableTooltipEl.style.top = newPos[2] + position.top + window.pageYOffset - 45 + 'px';
							payableTooltipEl.style.left = dataPoints[2].x + 125
								+ (payableTooltipEl.offsetLeft > position.width / 2 ? -payableTooltipEl.offsetWidth : 0) + 'px';
							payableTooltipEl.style.zIndex = 1;
							payableTooltipEl.style.borderRadius = '4px';
							payableTooltipEl.style.borderColor = UtilitiesService.hexToRgba(COLORS.WARN, .41);
							payableTooltipEl.style.borderStyle = 'solid';
							payableTooltipEl.style.padding = '8px 20px';
							payableTooltipEl.style.backgroundColor = UtilitiesService.hexToRgba(COLORS.WHITE);

						} else {
							if (payableTooltipEl) {
								payableTooltipEl.style.opacity = 0;
							}
						}
					}
				},
			},
		});
	}

	// tslint:disable-next-line:valid-jsdoc
	/**
	 * Calcualte real and receivable plan
	 * @param {array} result
	 * @return {array}
	 */
	public processChartData(data: any, data2: any) {
		const radius = [];
		radius.push(3);
		for (let index: number = 1; index < data2.data.length; index++) {
			radius.push(0);
		}
		for (let index: number = 0; index < data2.data.length; index++) {
			if (data2.data[index].income !== 0 || data2.data[index].cost !== 0) {
				radius[index] = 3;
			}
		}
		const data3: Array<any> = [];
		for (let i: number = 0; i < data.data.length; i++) {
			if (radius[i]) {
				data3.push(data.data[i]);
			}
		}
		for (let i: number = 0; i < data3.length - 1; i++) {
			const index1: number = data.data.indexOf(data3[i]);
			const index2: number = data.data.indexOf(data3[i + 1]);
			const y0: number = data.data[index1];
			const yn: number = data.data[index2];
			const deltaX1: number = index2 - index1;
			for (let j: number = index1 + 1; j < index2; j++) {
				const deltaX2: number = index2 - j;
				data.data[j] = (y0 - yn) * deltaX2 / deltaX1 + yn;
			}
		}
		const ind0: number = data.data.indexOf(data3[0]);
		if (ind0 > 1) {
			data.data[0] = 0;
			const y0: number = 0;
			const yn: number = data.data[ind0];
			const deltaX1: number = ind0;
			for (let j: number = 1; j < ind0; j++) {
				const deltaX2: number = ind0 - j;
				data.data[j] = (y0 - yn) * deltaX2 / deltaX1 + yn;
			}
		}
		// end cutting
		const lastIndex: number = data.data.length - 1;

		for (let i = data.data.indexOf(data3[data3.length - 1]) + 1; i < data.data.length; i++) {
			data.data.pop();
			data2.data.pop();
		}

		if (!radius[lastIndex]) {
			data.data.pop();
			data2.data.pop();
		}

		return radius;
	}

	public processChartDataRRP(data: any, data2: any, layer: number) {
		const radius = [];
		radius.push(3);
		for (let index: number = 1; index < data2.data.length; index++) {
			radius.push(0);
		}
		for (let index: number = 1; index < data2.data.length; index++) {
			let canChange: number = 0;
			if (layer === 1) {
				canChange = +NumberService.addCommas(
					(
						data2.data[index] &&
						data2.data[index].income ?
							data2.data[index].income : 0
					) -
					(
						data2.data[index] &&
						data2.data[index - 1].income ?
							data2.data[index - 1].income : 0
					)
				);
			} else if (layer === 2) {
				canChange = +NumberService.addCommas(
					(
						data2.data[index] &&
						data2.data[index].cost ?
							data2.data[index].cost : 0
					) -
					(
						data2.data[index] &&
						data2.data[index - 1].cost ?
							data2.data[index - 1].cost : 0
					)
				);
			} else {
				canChange = +NumberService.addCommas(
					(
						data2.data[index] &&
						data2.data[index].income_plan ?
							data2.data[index].income_plan : 0
					) -
					(
						data2.data[index] &&
						data2.data[index - 1].income_plan ?
							data2.data[index - 1].income_plan : 0
					)
				);
			}
			if (+canChange !== 0) {
				radius[index] = 3;
			}
		}
		const data3: Array<any> = [];
		for (let i: number = 0; i < data.data.length; i++) {
			if (radius[i]) {
				data3.push(data.data[i]);
			}
		}
		for (let i: number = 0; i < data3.length - 1; i++) {
			const index1: number = data.data.indexOf(data3[i]);
			const index2: number = data.data.indexOf(data3[i + 1]);
			const y0: number = data.data[index1];
			const yn: number = data.data[index2];
			const deltaX1: number = index2 - index1;
			for (let j: number = index1 + 1; j < index2; j++) {
				const deltaX2: number = index2 - j;
				data.data[j] = (y0 - yn) * deltaX2 / deltaX1 + yn;
			}
		}
		const ind0: number = data.data.indexOf(data3[0]);
		if (ind0 > 1) {
			data.data[0] = 0;
			const y0: number = 0;
			const yn: number = data.data[ind0];
			const deltaX1: number = ind0;
			for (let j: number = 1; j < ind0; j++) {
				const deltaX2: number = ind0 - j;
				data.data[j] = (y0 - yn) * deltaX2 / deltaX1 + yn;
			}
		}

		const lastIndex: number = data.data.length - 1;

		for (let i = data.data.indexOf(data3[data3.length - 1]) + 1; i < data.data.length; i++) {
			data.data.pop();
			data2.data.pop();
		}

		if (!radius[lastIndex]) {
			data.data.pop();
			data2.data.pop();
		}

		return radius;
	}
}
