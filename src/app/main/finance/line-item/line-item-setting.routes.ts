import { Routes } from '@angular/router';

import { LineItemSettingComponent } from './components/line-item-setting.component';
import { LineItemCategoryComponent } from './components/line-item-category.component';
import { AuthGrantService } from '@auth/services/auth-grant.service';
import { AuthRoleService } from '@auth/services/auth-role.service';

export const lineItemSettingRoutes: Routes = [
	{
		path		: 'line-item',
		component	: LineItemSettingComponent,
		canActivate	: [ AuthGrantService, AuthRoleService ],
		data: {
			title		: 'Line Item',
			translate	: 'FINANCE.DIRECTION.LINE_ITEM',
			roles		: [ 'CEO', 'ADMIN', 'PROCUREMENT_MANAGER' ],
		},
		children: [
			{ path: '', redirectTo: 'category', pathMatch: 'full' },
			{
				path		: 'category',
				component	: LineItemCategoryComponent,
				data: {
					title		: 'Category',
					translate	: 'FINANCE.DIRECTION.CATEGORY',
				},
			},
		],
	},
];
