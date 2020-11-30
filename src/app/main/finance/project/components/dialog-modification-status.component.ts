import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { ProjectCostModificationService } from '@finance/project/services/project-cost-modification.service';
import { COST_MODIFICATION_STATUS } from '@resources';

@Component({
	selector	: 'dialog-modification-status',
	templateUrl	: '../templates/dialog-modification-status.pug',
})
export class DialogModificationStatusComponent extends ProjectBaseComponent implements OnInit, OnDestroy {

	public modificationStatusForm: FormGroup;
	public isUpdating: boolean;
	public costModification: any = {};
	public COST_MODIFICATION_STATUS: any = COST_MODIFICATION_STATUS;

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectCostModificationService} projectCostModificationService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef						: MatDialogRef<DialogModificationStatusComponent>,
		public injector							: Injector,
		public fb								: FormBuilder,
		public snackBarService					: SnackBarService,
		public projectCostModificationService	: ProjectCostModificationService
	) {
		super( injector );

		this.modificationStatusForm = fb.group({
			status: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.pattern(
						new RegExp( [ COST_MODIFICATION_STATUS.APPROVED, COST_MODIFICATION_STATUS.REJECTED ].join( '|' ) )
					),
				]),
			],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.costModification, this.data );
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		super.ngOnDestroy();
	}

	/**
	* Click No button event
	* @return {void}
	*/
	public onNoClick() {
		this.dialogRef.close();
	}

	/**
	* Update status
	* @return {void}
	*/
	public update() {
		this.isUpdating = true;

		this.projectCostModificationService
		.updateStatus(
			this.costModification.id,
			{ status: this.costModification.status }
		)
		.subscribe( ( result: any ) => {
			this.isUpdating = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'OVER_TOTAL_EXTRA_FEE' ) {
					this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.OVER_TOTAL_EXTRA_FEE', this.costModification );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_COST_MODIFICATION_FAIL', this.costModification );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_COST_MODIFICATION_SUCCESS', this.costModification );

			this.dialogRef.close( true );
		} );
	}

}
