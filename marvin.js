var Botkit = require('botkit');
var _ = require('underscore');
var promise = require('bluebird');
var conversation = require('./conversation');
var config = require('./config.json');
var rundeck = require('./rundeck.js').rundeck(config);

var controller = Botkit.slackbot({
    debug: false,
    json_file_store: config.json_file_store
});

var bot = controller.spawn({
    token: config.slack_token
}).startRTM();

controller.hears('help', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    var commands = [];
    commands.push({name: 'help', description: 'Displays all of the help commands'});
    commands.push({name: 'projects', description: 'Displays the list of projects'});
    commands.push({name: '[project] jobs', description: 'Displays the list of jobs for the named project'});
    commands.push({name: 'alias set [name] [id]', description: 'Creates a job alias name ➞ id'});
    commands.push({name: 'alias list', description: 'Lists all the available job aliases'});
    commands.push({name: 'run [job]', description: 'Runs the given job (either an id or an alias)'});
    var response = _.sample(conversation.help) + commands.map(c => "\n>`" + c.name + "` - " + c.description).join();
    bot.reply(message, response);
});

controller.hears('projects', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    rundeck.listProjects().then(function (projects) {
        bot.reply(message, _.sample(conversation.projects) + projects.map(s => "\n>" + s).join());
    }).catch(function (error) {
        replyToError(message, error.message);
    });
});

controller.hears('(\\w+) jobs', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    var projectLowerCase = message.match[1].toLowerCase();

    rundeck.listProjects().then(function (projects) {
        var project = projects.find(p => p.toLowerCase().startsWith(projectLowerCase));
        if (!project)
            replyToError(message, "No such project: " + message.match[1]);
        else
            return rundeck.listJobs(project).then(function (jobs) {
                if (jobs.length > 0)
                    bot.reply(message, _.sample(conversation.jobs(project)) + jobs.map(s => "\n>" + s.name + " _(" + s.id + ")_").join());
                else
                    bot.reply(message, _.sample(conversation.nojobs(project)));
            });
    }).catch(function (error) {
        replyToError(message, error.message);
    });
});

controller.hears('alias set ([\\w-]+) ([\\w-]+)', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    var name = message.match[1];
    var id = message.match[2];

    rundeck.findJob(id).then(function () {
        bot.reply(message, _.sample(conversation.aliases));
        controller.storage.channels.save({id: name, alias: id});
    }).catch(function (error) {
        console.log(error);
        replyToError(message, error.error.message);
    });
});

controller.hears('alias list', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    controller.storage.channels.all(function (err, res) {
        bot.reply(message, res.map(a => "\n" + a.id + " ➞ " + a.alias).join());
    })
});

controller.hears('run ([\\w-]+)', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    var userInfo = promise.promisify(bot.api.users.info);
    var id = message.match[1];

    userInfo({user: message.user})
        .then(function (res) {
            rundeck.runJob(id, res.user.name).then(function (r) {
                console.log('exec' + JSON.stringify(r));
                bot.reply(message, "Ok, I'm running your job for you...");
                if (r.job.averageDuration) {
                    bot.reply(message, "On average, this job takes about " + Math.round(parseInt(r.job.averageDuration) / 1000) + "s to complete");
                }

                rundeck.finalExecutionStatus(r.id).then(function (res) {
                    //console.log(JSON.stringify(res));
                    switch (res.state) {
                        case 'succeeded':
                            bot.reply(message, {
                                attachments: [{
                                    "color": "good",
                                    fallback: "Good news!",
                                    text: "Good news! It completed in " + Math.ceil(res.duration / 1000) + " seconds"
                                }]
                            });
                            break;
                        case 'failed':
                        case 'aborted':
                            bot.reply(message, "Uh oh, looks like there was a problem :-(");
                            break;
                    }
                });
            }).catch(function () {
                return replyToError(message, "Unable to run job " + id);
            });
        });
});

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
    var response = _.sample(conversation.random);
    bot.reply(message, response);
});

function replyToError(message, error) {
    var remark = _.sample(conversation.errors);

    bot.reply(message, {
        text: remark,
        attachments: [{"color": "danger", text: error, fallback: remark}]
    });
}