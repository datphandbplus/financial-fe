import { NgModule } from '@angular/core';

import { CoreModule } from '@core/core.module';

/* Component Import (Do not remove) */
import { CostItemSettingComponent } from './components/cost-item-setting.component';
import { CostItemCategoryComponent } from './components/cost-item-category.component';
import { DialogCostItemCategoryComponent } from './components/dialog-cost-item-category.component';
/* End Component Import (Do not remove) */

/* Service Import (Do not remove) */
import { CostItemCategoryService } from './services/cost-item-category.service';
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule ],
	declarations: [
		/* Component Inject (Do not remove) */
		CostItemSettingComponent, CostItemCategoryComponent, DialogCostItemCategoryComponent,
		/* End Component Inject (Do not remove) */
	],
	entryComponents: [
		/* Component Inject (Do not remove) */
		DialogCostItemCategoryComponent,
		/* End Component Inject (Do not remove) */
	],
	providers: [
		/* Service Inject (Do not remove) */
		CostItemCategoryService,
		/* End Service Inject (Do not remove) */
	],
})
export class CostItemSettingModule {

	/**
	* @constructor
	*/
	constructor() {}

}
