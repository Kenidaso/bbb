const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * CmdExec Model
 * =============
 */

const CmdExec = new keystone.List('CmdExec', {
	map: { name: 'cmd' },
	autokey: { from: 'cmd', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	createdBy: true,
  	updatedAt: true,
  	updatedBy: true
	},
	perPage: 20,
	defaultColumns: 'cmd description status',
	defaultSort: '-updatedAt'
});

CmdExec.add({
	cmd: { type: String, required: true, initial: true },
	description: { type: Types.Textarea, initial: true },
	status: { type: Number, required: true, default: 1 },
});

CmdExec.schema.virtual('isActive').get(function () {
  return this.status === 1;
});

CmdExec.register();
