var _ = require('underscore');
var promise = require('bluebird');
var conversation = require('./conversation');
var config = require('./config.json');
var rundeck = require('./rundeck.js').rundeck(config);

var marvin = require('botkit').slackbot({
    debug: false,
    json_file_store: config.json_file_store
});

var bot = marvin.spawn({
    token: config.slack_token
}).startRTM();

marvin.hears('help', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    var commands = [];
    commands.push({name: 'help', description: 'Displays all of the help commands'});
    commands.push({name: 'projects', description: 'Displays the list of projects'});
    commands.push({name: '[project] jobs', description: 'Displays the list of jobs for the named project'});
    commands.push({name: 'alias set [name] [id]', description: 'Creates a job alias name ➞ id for this channel'});
    commands.push({name: 'alias list', description: 'Lists all the available job aliases for this channel'});
    commands.push({name: 'run [job]', description: 'Runs the given job (either an id or an alias)'});
    var response = _.sample(conversation.help) + commands.map(c => "\n>`" + c.name + "` - " + c.description).join();
    bot.reply(message, response);
});

marvin.hears('projects', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    rundeck.listProjects().then(function (projects) {
        bot.reply(message, _.sample(conversation.projects) + projects.map(s => "\n>" + s).join());
    }).catch(function (error) {
        replyToError(message, error.message);
    });
});

marvin.hears('(\\w+) jobs', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    var projectLowerCase = message.match[1].toLowerCase();

    rundeck.listProjects().then(function (projects) {
        var project = projects.find(p => p.toLowerCase().startsWith(projectLowerCase));
        if (!project)
            replyToError(message, "No such project: " + message.match[1]);
        else
            return rundeck.listJobs(project).then(function (jobs) {
                if (jobs.length > 0)
                    bot.reply(message, "Here are the jobs for " + project + ". " + _.sample(conversation.jobs) + jobs.map(s => "\n>" + s.name + " _(" + s.id + ")_").join());
                else
                    bot.reply(message, "There are no jobs for " + project + ". " + _.sample(conversation.nojobs));
            });
    }).catch(function (error) {
        replyToError(message, error.message);
    });
});

marvin.hears('alias set ([\\w-]+) ([\\w-]+)', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    var name = message.match[1];
    var id = message.match[2];

    rundeck.findJob(id).then(function () {
        bot.reply(message, _.sample(conversation.alias_set));
        marvin.storage.channels.get(message.channel, function(err, res) {
            if (err)
                res = {id: message.channel, aliases: {}};
            res.aliases[name] = id;
            marvin.storage.channels.save(res);
        });
    }).catch(function (error) {
        replyToError(message, error.error.message);
    });
});

marvin.hears('alias list', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    marvin.storage.channels.get(message.channel, function(err, res) {
        if (res) {
            var aliases = [];
            for (var a in res.aliases) {
                aliases.push({name: a, job_id: res.aliases[a]});
            }
            bot.reply(message, _.sample(conversation.aliases) + aliases.map(a => "\n" + a.name + " ➞ " + a.job_id).join());
        }
        else
            bot.reply(message, "There aren't any aliases in this channel");
    });
});

marvin.hears('run ([\\w-]+)', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    var userInfo = promise.promisify(bot.api.users.info);
    var job = message.match[1];

    var id;
    // First check if it's an alias
    marvin.storage.channels.get(message.channel, function(err, res) {
        // An alias
        if (res && res.aliases && res.aliases[job])
            id = res.aliases[job];
        // Not an alias
        else
            id = job;
    });

    userInfo({user: message.user})
        .then(function (res) {
            rundeck.runJob(id, res.user.name).then(function (r) {
                bot.reply(message, _.sample(conversation.job_started));
                // How often should we poll to find out job completion
                var max_tries = 10;
                var interval = 5000;
                // Assume that worst case is 2 times the average
                if (r.job.averageDuration)
                    interval = Math.round(parseInt(r.job.averageDuration) * 2 / max_tries);

                rundeck.finalExecutionStatus(r.id, interval, max_tries).then(function (res) {
                    switch (res.state) {
                        case 'succeeded':
                            var remark = _.sample(conversation.job_success);
                            bot.reply(message, {
                                text: remark,
                                attachments: [{
                                    "color": "good",
                                    text: job + " completed in " + Math.ceil(res.duration / 1000) + " seconds",
                                    fallback: remark
                                }]
                            });
                            break;
                        case 'failed':
                        case 'aborted':
                            replyToError(message, job + " " + res.state + " in " + Math.ceil(res.duration / 1000) + " seconds");
                            break;
                    }
                });
            }).catch(function () {
                return replyToError(message, "Unable to run job " + job);
            });
        });
});

marvin.hears('.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
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