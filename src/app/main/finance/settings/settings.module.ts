import { NgModule } from '@angular/core';
import { ColorPickerModule } from 'ngx-color-picker';

import { CoreModule } from '@core/core.module';

/* Component Import (Do not remove) */
import { SettingsComponent } from './components/settings.component';
import { GeneralComponent } from './components/general.component';
/* End Component Import (Do not remove) */

/* Service Import (Do not remove) */
import { SettingService } from './services/setting.service';
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule, ColorPickerModule ],
	declarations: [
		/* Component Inject (Do not remove) */
		SettingsComponent, GeneralComponent,
		/* End Component Inject (Do not remove) */
	],
	entryComponents: [
		/* Component Inject (Do not remove) */
		/* End Component Inject (Do not remove) */
	],
	providers: [
		/* Service Inject (Do not remove) */
		SettingService,
		/* End Service Inject (Do not remove) */
	],
})
export class SettingsModule {

	/**
	* @constructor
	*/
	constructor() {}

}
