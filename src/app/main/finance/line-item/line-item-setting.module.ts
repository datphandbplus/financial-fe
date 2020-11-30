import { NgModule } from '@angular/core';

import { CoreModule } from '@core/core.module';

/* Component Import (Do not remove) */
import { LineItemSettingComponent } from './components/line-item-setting.component';
import { LineItemCategoryComponent } from './components/line-item-category.component';
import { DialogLineItemCategoryComponent } from './components/dialog-line-item-category.component';
/* End Component Import (Do not remove) */

/* Service Import (Do not remove) */
import { LineItemCategoryService } from './services/line-item-category.service';
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule ],
	declarations: [
		/* Component Inject (Do not remove) */
		LineItemSettingComponent, LineItemCategoryComponent, DialogLineItemCategoryComponent,
		/* End Component Inject (Do not remove) */
	],
	entryComponents: [
		/* Component Inject (Do not remove) */
		DialogLineItemCategoryComponent,
		/* End Component Inject (Do not remove) */
	],
	providers: [
		/* Service Inject (Do not remove) */
		LineItemCategoryService,
		/* End Service Inject (Do not remove) */
	],
})
export class LineItemSettingModule {

	/**
	* @constructor
	*/
	constructor() {}

}
