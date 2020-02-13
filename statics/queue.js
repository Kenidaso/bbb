const NODE_ENV = process.env.NODE_ENV || 'development';

let task_worker = {
	name: `${NODE_ENV}-Queue_Task_Worker`,
	ns: `rsmq_task_worker`,

	vt: 60 * 2, // 2min: The length of time, in seconds, that a message received from a queue will be invisible to other receiving components when they ask to receive messages
	// vt: 30
}

module.exports = {
	task_worker
}