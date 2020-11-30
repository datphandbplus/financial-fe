import { Routes } from '@angular/router';

import { VendorSettingComponent } from './components/vendor-setting.component';
import { VendorCategoryComponent } from './components/vendor-category.component';
import { VendorComponent } from './components/vendor.component';
import { AuthGrantService } from '@auth/services/auth-grant.service';
import { AuthRoleService } from '@auth/services/auth-role.service';

export const vendorSettingRoutes: Routes = [
	{
		path		: 'vendor',
		component	: VendorSettingComponent,
		canActivate	: [ AuthGrantService, AuthRoleService ],
		data: {
			title		: 'Vendor',
			translate	: 'FINANCE.DIRECTION.VENDOR',
			roles: [
				'CEO', 'ADMIN',
				'PROCUREMENT_MANAGER', 'CONSTRUCTION_MANAGER',
			],
		},
		children: [
			{ path: '', redirectTo: 'list', pathMatch: 'full' },
			{
				path		: 'list',
				component	: VendorComponent,
				data: {
					title		: 'List',
					translate	: 'FINANCE.DIRECTION.LIST',
				},
			},
			{
				path		: 'category',
				component	: VendorCategoryComponent,
				data: {
					title		: 'Category',
					translate	: 'FINANCE.DIRECTION.CATEGORY',
				},
			},
		],
	},
];
