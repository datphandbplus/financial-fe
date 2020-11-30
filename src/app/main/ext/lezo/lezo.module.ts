import { NgModule } from '@angular/core';

import { CoreModule } from '@core/core.module';

/* Service Import (Do not remove) */
import { LezoEmployeeService } from './services/lezo-employee.service';
import { LezoProjectService } from './services/lezo-project.service';
import { LezoClientService } from './services/lezo-client.service';
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule ],
	providers: [
		/* Service Inject (Do not remove) */
		LezoEmployeeService, LezoProjectService, LezoClientService
		/* End Service Inject (Do not remove) */
	],
})
export class LezoModule {

	/**
	* @constructor
	*/
	constructor() {}

}
