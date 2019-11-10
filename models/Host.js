const mongoose = require('mongoose');
const { Schema } = mongoose;

const keystone = require('keystone');
const Types = keystone.Field.Types;

let configModel = require('../statics/configModel');
let { host_names } = configModel;

let { minify } = require('../helpers/stringUtils');

/**
 * Host Model
 * =============
 */

const Host = new keystone.List('Host', {
	map: { name: 'website' },
	autokey: { from: 'website', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	createdBy: true,
  	updatedAt: true,
  	updatedBy: true
	},
	perPage: 20,
	defaultColumns: 'name website',
	defaultSort: '-updatedAt'
});

Host.add({
	name: {
		type: Types.Text,
		required: true,
		initial: true,
		index: true
	},
	website: { type: Types.Url, initial: true, index: true, unique: true },
	engine: { type: String, initial: true }, // tên engine sử dụng
	metadataJson: { type: Types.Textarea, initial: true },
});

Host.schema.add({ metadata: Schema.Types.Mixed });

Host.schema.pre('save', function (next) {
	if (this.metadataJson) {
		let _tmp = null;
		try {
			_tmp = JSON.parse(this.metadataJson);
		} catch (ex) {
			this.metadataJson = ex.toString() + '\n' + this.metadataJson;
			return next('EPARSEJSON');
		}

		if (_tmp) {
			this.metadata = _tmp;
			this.metadataJson = minify(this.metadataJson);
		}
	}

	return next();
});

Host.register();
