const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
	text: {
		type: String,
		required: true,
	},
	created_on: {
		type: Date,
		default: Date.now,
	},
	reported: {
		type: Boolean,
		default: false,
	},
	delete_password: {
		type: String,
		required: true,
	},
});

exports.Reply = mongoose.model("Reply", replySchema);

exports.threadSchema = new mongoose.Schema({
	text: {
		type: String,
		required: true,
	},
	created_on: {
		type: Date,
		default: Date.now,
	},
	bumped_on: {
		type: Date,
		default: Date.now,
	},
	reported: {
		type: Boolean,
		default: false,
	},
	delete_password: {
		type: String,
		required: true,
	},
	replies: {
		type: [replySchema],
		default: [],
	},
});
