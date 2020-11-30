import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';


const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
];

export const routingProviders: Array<any>[] = [];
export const routing: ModuleWithProviders = RouterModule.forRoot( routes, { useHash: false } );
