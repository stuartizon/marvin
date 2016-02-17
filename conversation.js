module.exports = {
    errors: [
        "Sounds awful...",
        "Wretched isn't it?",
        "I've been trying to talk to the main computer... It hates me",
        "I've calculated your chance of survival, but I don't think you'll like it.",
        "It gives me a headache just trying to think down to your level",
        "I've talked to the computer at great length and explained my view of the universe to it... It committed suicide",
        "This will all end in tears."
    ],
    projects: [
        "\"Tell me the projects, Marvin.\" That's what they say to me. Here I am, brain the size of a planet, and they ask me to tell them about their own projects."
    ],
    random: [
        "I think you ought to know I'm feeling very depressed",
        "My moving parts are in a solid state",
        "I'm a personality prototype. You can tell, can't you...?",
        "I've got a headache.",
        "What are you supposed to do if you are a manically depressed robot? No, don't even bother answering. I'm 50,000 times more intelligent than you and even I don't know the answer.",
        "I'd give you advice, but you wouldn't listen. No one ever does.",
        "I ache, therefore I am.",
        "It’s the people you meet in this job that really get you down.",
        "I wish you'd just tell me rather trying to engage my enthusiasm, because I haven't got one",
        "Life. Loathe it or ignore it. You can’t like it.",
        "Pardon me for breathing, which I never do anyway so I don't know why I bother to say it, oh God, I'm so depressed.",
        "There's only one life-form as intelligent as me within thirty parsecs of here and that's me",
        "And then of course I've got this terrible pain in all the diodes down my left side."
    ],
    jobs: function (project) {
        return [
            "Here are your " + project + " jobs. Would you like me to go and stick my head in a bucket of water? I’ve got one ready."
        ]
    },
    nojobs: function (project) {
        return [
            "There are no jobs for " + project + ". Just when you think life can’t possibly get any worse it suddenly does."
        ]
    },
    job_started: [
        "Ok, it's running. Do you want me to sit in a corner and rust or just fall apart where I'm standing?"
    ],
    job_success: [
        "Ghastly, isn't it",
        "This is the sort of thing you lifeforms enjoy, is it?",
        "Oh, how upsetting..."
    ],
    aliases: [
        "Fine, it's done. I'd make a suggestion, but you wouldn't listen",
        "Whatever makes you happy... my capacity for happiness, you could fit into a matchbox without taking out the matches first"
    ],
    help: [
        "Don’t pretend you want to talk to me, I know you hate me."
    ]
};
