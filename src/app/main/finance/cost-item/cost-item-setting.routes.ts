import { Routes } from '@angular/router';

import { CostItemSettingComponent } from './components/cost-item-setting.component';
import { CostItemCategoryComponent } from './components/cost-item-category.component';
// import { CostItemComponent } from './components/cost-item.component';
// import { CostItemVendorComponent } from './components/cost-item-vendor.component';
import { AuthGrantService } from '@auth/services/auth-grant.service';
import { AuthRoleService } from '@auth/services/auth-role.service';

export const costItemSettingRoutes: Routes = [
	{
		path		: 'cost-item',
		component	: CostItemSettingComponent,
		canActivate	: [ AuthGrantService, AuthRoleService ],
		data: {
			title		: 'Cost Item',
			translate	: 'FINANCE.DIRECTION.COST_ITEM',
			roles		: [ 'CEO', 'ADMIN', 'PROCUREMENT_MANAGER' ],
		},
		children: [
			{ path: '', redirectTo: 'category', pathMatch: 'full' },
			// {
			// 	path		: 'vendor',
			// 	component	: CostItemVendorComponent,
			// 	data: {
			// 		title		: 'Vendor',
			// 		translate	: 'FINANCE.DIRECTION.VENDOR',
			// 	},
			// },
			// {
			// 	path		: 'list',
			// 	component	: CostItemComponent,
			// 	data: {
			// 		title		: 'List',
			// 		translate	: 'FINANCE.DIRECTION.LIST',
			// 	},
			// },
			{
				path		: 'category',
				component	: CostItemCategoryComponent,
				data: {
					title		: 'Category',
					translate	: 'FINANCE.DIRECTION.CATEGORY',
				},
			},
		],
	},
];
