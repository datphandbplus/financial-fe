import {
	OnInit, OnDestroy, Component,
	Injector, Input
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import _ from 'underscore';

import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { ProjectService } from '@finance/project/services/project.service';

@Component({
	selector	: 'project-vo',
	templateUrl	: '../templates/project-vo.pug',
})
export class ProjectVOComponent extends ProjectBaseComponent implements OnInit, OnDestroy {

	@Input() public project: any;
	@Input() public projectId: number;
	@Input() public loaded: boolean;

	public currentVO: any;
	public projectDetail: any = {};
	/**
	* @constructor
	* @param {Injector} injector
	* @param {Router} router
	* @param {ActivatedRoute} route
    * @param {ProjectService} projectService
	*/
	constructor(
		public injector	: Injector,
		public router	: Router,
		public route	: ActivatedRoute,
		public projectService : ProjectService,
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
		this.getProjectDetail();
	}

	/**
	 * Get projects
	 * @return {void}
	 */
	public getProjectDetail() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectService
			.getOne( this.projectId, 'project_info' )
			.subscribe( ( result: any ) => {
				this.setProcessing( false );
				this.projectDetail = result;
				this.loaded = true;
			} );
	}

}
