const mongoose = require('mongoose');
const { Schema } = mongoose;
const url = require('url');

const keystone = require('keystone');
const Types = keystone.Field.Types;

let configModel = require('../statics/configModel');
let { host_names } = configModel;

const RedisService = require('../routes/services/RedisService');

let { minify } = require('../helpers/stringUtils');

let utils = require('../helpers/utils');

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
	perPage: 50,
	defaultColumns: 'name display website',
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
	display: { type: Types.Text },
	styles: { type: Types.Relationship, ref: 'Style', initial: true, many: true },
	customClass: { type: Types.TextArray },
	engine: { type: String, initial: true }, // tên engine sử dụng

	mainContentSelector: { type: Types.Text, initial: true }, // main content,
	fallbackMainContent: { type: Types.TextArray }, // fallback nếu main selector không có kết quả

	removeSelectors: { type: Types.TextArray }, // những thứ cần remove đi

	// heroImage: { type: Types.TextArray },

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

	// trigger delete key redis
	let host = utils.getMainDomain(this.website);
	let keyHost = `host:${host}`;
	console.log('trigger delete key redis:', keyHost);
	RedisService.del(keyHost);

	return next();
});

Host.register();
