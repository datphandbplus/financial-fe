// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=staging` then `environment.staging.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const ENVIRONMENT: any = {
	PRODUCTION			: false,
	MULTI_CHANNELS		: false,
	SERVER_API_URL		: 'https://staging-api.dbplus.com.vn',
	SERVER_WEBSOCKET_URL: 'https://socket-finance.lezo-revolve.cf',
	APP_URL				: 'https://staging.dbplus.com.vn',
	APP_DOMAIN			: 'staging.dbplus.com.vn',
	APP_NAME			: 'Finance Stg Tool',
	APP_LOGO			: './assets/images/logo.png',
	APP_LOGO_BLUE		: './assets/images/logo-blue.png',
	APP_FAVICON			: './assets/favicon.ico',
	APP_TITLE			: 'Finance Tool',
	APP_VERSION			: '2.3',
};

