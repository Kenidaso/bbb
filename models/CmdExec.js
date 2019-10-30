const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * CmdExec Model
 * =============
 */

const CmdExec = new keystone.List('CmdExec', {
	map: { name: 'name' },
	autokey: { from: 'name', path: 'slug', unique: true },
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
	name: { type: String, required: true, initial: true },
	cmd: { type: String, required: true, initial: true },
	description: { type: Types.Textarea, initial: true },
	status: { type: Types.Number, required: true, default: 1 },
});

CmdExec.schema.virtual('isActive').get(function () {
  return this.status === 1;
});

CmdExec.register();
