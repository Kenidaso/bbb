const Agenda = require('agenda');

const MONGO_URI = process.env.MONGO_URI;

const connectionOpts = {
	db: {
		address: MONGO_URI,
		collection: 'agendaJobs'
	},
	name: 'news-backend-agenda',
	processEvery: '10 seconds',
	maxConcurrency: 10,
	defaultConcurrency: 2,
};

const agenda = new Agenda(connectionOpts);

// const jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];

const jobTypes = [
	'notify_feed'
];

jobTypes.forEach(type => {
  require(`../jobs/agenda/${type}`)(agenda);
});

if (jobTypes.length) {
  // agenda.start(); // Returns a promise, which should be handled appropriately

  (async function() { // IIFE to give access to async/await
    // await agenda.start();
    // await agenda.schedule('in 10 seconds', 'notify feed', { to: 'admin@example.com' });
    // await agenda.every('10 seconds', 'notify feed');
  })();
}

agenda.on('start', job => {
	console.log('Job %s starting', job.attrs.name);
});

agenda.on('complete', job => {
  console.log(`Job ${job.attrs.name} finished`);
});

agenda.on('success', job => {
  console.log(`Job Successfully: ${job.attrs.name}`);
});

agenda.on('fail', (err, job) => {
  console.log(`Job "${job.attrs.name}" failed with error: ${err.message}`);
});

let graceful = () => {
    agenda.stop(() => process.exit(0));
}

process.on("SIGTERM", graceful);
process.on("SIGINT", graceful);

module.exports = agenda;