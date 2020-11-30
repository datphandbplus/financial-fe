import { NgModule } from '@angular/core';
import { ChartsModule } from 'ng2-charts';

import { CoreModule } from '@core/core.module';

/* Component Import (Do not remove) */
import { DashboardComponent } from './components/dashboard.component';
/* End Component Import (Do not remove) */

/* Service Import (Do not remove) */
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule, ChartsModule ],
	declarations: [
		/* Component Inject (Do not remove) */
		DashboardComponent,
		/* End Component Inject (Do not remove) */
	],
	entryComponents: [
		/* Component Inject (Do not remove) */
		DashboardComponent,
		/* End Component Inject (Do not remove) */
	],
	providers: [
		/* Service Inject (Do not remove) */
		/* End Service Inject (Do not remove) */
	],
})
export class DashboardModule {

	/**
	* @constructor
	*/
	constructor() {}

}
