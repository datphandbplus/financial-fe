import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { LoginComponent } from './components/login.component';
import { LogoutComponent } from './components/logout.component';
import { ActivateComponent } from './components/activate.component';
import { SyncTokenComponent } from './components/sync-token.component';

const routes: Routes = [
	{
		path		: 'login',
		component	: LoginComponent,
	},
	{
		path		: 'logout',
		component	: LogoutComponent,
	},
	{
		path		: 'activate',
		component	: ActivateComponent,
	},
	{
		path		: 'sync-token',
		component	: SyncTokenComponent,
	},
];

export const routingProviders: Array<any>[] = [];
export const routing: ModuleWithProviders = RouterModule.forChild( routes );
