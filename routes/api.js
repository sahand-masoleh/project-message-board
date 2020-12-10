"use strict";
const mongoose = require("mongoose");
mongoose.connect(
	process.env.DB,
	{ useNewUrlParser: true, useUnifiedTopology: true },
	() => console.log("connected to DB...")
);

const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const { threadSchema, Reply } = require("../models/Post");

const regex = /\w/gi;
const boardName = (board) => {
	return board.match(regex).slice(0, 20).join("");
};

module.exports = (app) => {
	app
		.route("/api/threads/:board")
		.get(async (req, res) => {
			let board = boardName(req.params.board);
			let Thread = mongoose.model("Thread", threadSchema, board);
			try {
				let result = await Thread.aggregate([
					{
						$unwind: {
							path: "$replies",
							preserveNullAndEmptyArrays: true,
						},
					},
					{
						$sort: { created_on: 1, "replies.created_on": 1 },
					},
					{
						$group: {
							_id: "$_id",
							text: { $first: "$text" },
							created_on: { $first: "$created_on" },
							bumped_on: { $first: "$bumped_on" },
							replies: {
								$push: {
									$cond: {
										if: "$replies",
										then: {
											_id: "$replies._id",
											text: "$replies.text",
											created_on: "$replies.created_on",
										},
										else: "$$REMOVE",
									},
								},
							},
						},
					},
					{
						$project: {
							text: true,
							created_on: true,
							bumped_on: true,
							replies: { $slice: ["$replies", 3] },
							replycount: { $size: "$replies" },
						},
					},
				]);
				res.json(result);
			} catch (error) {
				res.status(500).send(error.message);
			}
		})
		.post(async (req, res) => {
			if (!req.body.delete_password)
				return res.status(400).send("delete password not provided");
			let board = boardName(req.params.board);
			let Thread = mongoose.model("Thread", threadSchema, board);
			try {
				let delete_password = await bcrypt.hash(req.body.delete_password, SALT_ROUNDS);
				let thread = new Thread({
					text: req.body.text,
					delete_password,
				});
				await Thread.create(thread);
				res.status(200).send("success");
			} catch (error) {
				res.status(500).send(error.message);
			}
		})
		.delete(async (req, res) => {
			if (!req.body.thread_id) return res.status(400).send("thread_id not provided");
			if (!req.body.delete_password)
				return res.status(400).send("delete password not provided");
			let board = boardName(req.params.board);
			let Thread = mongoose.model("Thread", threadSchema, board);
			try {
				let thread = await Thread.findById(req.body.thread_id);
				if (!thread) return res.status(400).send("thread not found");
				let result = await bcrypt.compare(
					req.body.delete_password,
					thread.delete_password
				);
				if (!result) return res.status(400).send("incorrect password");
				await thread.remove();
				res.send("success");
			} catch (error) {
				res.status(500).send(error.message);
			}
		})
		.put(async (req, res) => {
			if (!req.body.thread_id) return res.status(400).send("thread_id not provided");
			let board = boardName(req.params.board);
			let Thread = mongoose.model("Thread", threadSchema, board);
			try {
				let thread = await Thread.findById(req.body.thread_id);
				if (!thread) return res.status(400).send("thread not found");
				thread.reported = true;
				await thread.save();
				res.status(200).send("success");
			} catch (error) {
				res.status(500).send(error.message);
			}
		});

	app
		.route("/api/replies/:board")
		.get(async (req, res) => {
			if (!req.query.thread_id) return res.status(400).send("thread_id not provided");
			let board = boardName(req.params.board);
			let Thread = mongoose.model("Thread", threadSchema, board);
			try {
				let thread = await Thread.findById(req.query.thread_id, {
					reported: false,
					delete_password: false,
					__v: false,
					"replies.delete_password": false,
					"replies.reported": false,
				});
				if (!thread) return res.status(400).send("thread not found");
				res.status(200).json(thread);
			} catch (error) {
				res.status(500).send(error.message);
			}
		})

		.post(async (req, res) => {
			if (!req.body.thread_id) return res.status(400).send("thread_id not provided");
			if (!req.body.delete_password)
				return res.status(400).send("delete password not provided");
			let board = boardName(req.params.board);
			let Thread = mongoose.model("Thread", threadSchema, board);
			try {
				let thread = await Thread.findById(req.body.thread_id);
				if (!thread) return res.status(400).send("thread not found");
				let delete_password = await bcrypt.hash(req.body.delete_password, SALT_ROUNDS);
				let reply = new Reply({
					text: req.body.text,
					delete_password,
				});
				thread.replies.push(reply);
				thread.bumped_on = Date.now();
				await thread.save();
				res.status(200).send("success");
			} catch (error) {
				res.status(500).send(error.message);
			}
		})

		.delete(async (req, res) => {
			if (!req.body.thread_id) return res.status(400).send("thread_id not provided");
			if (!req.body.reply_id) return res.status(400).send("reply_id not provided");
			if (!req.body.delete_password)
				return res.status(400).send("delete password not provided");
			let board = boardName(req.params.board);
			let Thread = mongoose.model("Thread", threadSchema, board);
			try {
				let thread = await Thread.findById(req.body.thread_id);
				if (!thread) return res.status(400).send("thread not found");
				let reply = thread.replies.id(req.body.reply_id);
				if (!reply) return res.status(400).send("reply not found");
				let result = await bcrypt.compare(
					req.body.delete_password,
					reply.delete_password
				);
				if (!result) return res.status(400).send("incorrect password");
				reply.text = "deleted";
				await thread.save();
				res.send("success");
			} catch (error) {
				res.status(500).send(error.message);
			}
		})
		.put(async (req, res) => {
			if (!req.body.thread_id) return res.status(400).send("thread_id not provided");
			if (!req.body.reply_id) return res.status(400).send("reply_id not provided");
			let board = boardName(req.params.board);
			let Thread = mongoose.model("Thread", threadSchema, board);
			try {
				let thread = await Thread.findById(req.body.thread_id);
				if (!thread) return res.status(400).send("thread not found");
				let reply = thread.replies.id(req.body.reply_id);
				if (!reply) return res.status(400).send("reply not found");
				reply.reported = true;
				await thread.save();
				res.status(200).send("success");
			} catch (error) {
				res.status(500).send(error.message);
			}
		});
};
