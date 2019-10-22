const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * CrawlLog Model
 * =============
 */

const CrawlLog = new keystone.List('CrawlLog', {
	track: {
		createdAt: true,
  	updatedAt: true,
	},
	perPage: 20,
	defaultColumns: 'cmd isError result',
	defaultSort: '-updatedAt'
});

CrawlLog.add({
	cmd: { type: String, initial: true },
	status: {
		type: Types.Select,
		options: [
			'NEW',
			'DONE',
			'ERROR'
		],
		defaults: 'NEW'
	},
	result: { type: Types.Textarea },
});

CrawlLog.register();
