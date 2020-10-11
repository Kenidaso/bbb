
module.exports = function (bull) {
  bull.process(function (job, done) {
    console.log(`bull data job=`, job.data);
    // job.data contains the custom data passed when the job was created
    // job.id contains id of this job.

    // transcode video asynchronously and report progress
    job.progress(42);

    console.log('--> [Bull] notify feed for user');

    // call done when finished
    done();

    // or give a error if error
    // done(new Error('error transcoding'));

    // or pass it a result
    // done(null, { framerate: 29.5 /* etc... */ });

    // If the job throws an unhandled exception it is also handled correctly
    // throw new Error('some unexpected error');
  });

  bull.on('completed', job => {
    console.log(`Notify Job with id ${job.id} has been completed`);
  });
};