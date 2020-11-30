import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { AccountSettingsComponent } from './components/account-settings.component';
import { AuthGrantService } from '@auth/services/auth-grant.service';

const routes: Routes = [
	{
		path		: 'account-settings',
		component	: AccountSettingsComponent,
		canActivate	: [ AuthGrantService ],
		data: {
			title		: 'Account Setting',
			translate	: 'ACCOUNT.LABELS.ACCOUNT_SETTINGS',
		},
	},
];

export const routingProviders: Array<any>[] = [];
export const routing: ModuleWithProviders = RouterModule.forChild( routes );
