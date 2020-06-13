const fs = require("fs");
const axios = require("axios");
const inquirer = require("inquirer");
const util = require("util");
const asyncWrite = util.promisify(fs.writeFile);


const githubQuestions = [
    {
        type: "input",
        message: "Please enter your GitHub username.",
        name: "username",
        validate: function(input) {
            if (input == "") {
                return "Please use a valid username."
            }
            else {
                return true;
            }
        }
    },
    {
        type: "input",
        message: "Please enter your GitHub repository name.",
        name: "repo"
    }

]

const readmeQuestions = [
    {
        type: "input",
        message: "Please enter the email address used for your GitHub account.",
        name: "email",
        validate: function(input) {
            if (input == "") {
                return "Please provide an email address."
            }
            else {
                return true;
            }
        }
    },
    {
        type: "input",
        message: "Please enter the title name of your project.",
        name: "title"
    },
    {
        type: "input",
        message: "Please provide any installation steps required for your project by the user.",
        name: "install"
    },
    {
        type: "input",
        message: "Please provide a description of your project: ",
        name: "description",
        validate: function(input) {
            if (input == "") {
                return "Your README must include a short description."
            }
            else {
                return true;
            }
        }
    },
    {
        type: "input",
        message: "Please provide instructions for the usage of your project: ",
        name: "usage",
    },
    {
        type: "input",
        message: "Please provide a command (if any) to run tests.",
        name: "test"
    },
    {
        type: "confirm",
        message: "Would you like to include Contributor Covenant licensing?",
        name: "contribute",
        default: false
    }
]

const licenseChoice = [
    {
        type: "list",
        message: "Please choose which open source license to add to your README or leave it blank (for now).",
        name: "license",
        choices: [
            "GNU GPLv3",
            "MIT",
            "Leave blank."
        ],
        filter: function(license) {
            switch(license) {
                case "GNU GPLv3":
                    return "GNU GPLv3";
                case "MIT":
                    return "MIT";
                case "Leave blank.":
                    return "None";
            }
        }
    }
]

function userPrompt(prompt) {
    return inquirer.prompt(prompt);
}

// Use Axios to get GitHub info.
function githubInfo(info) {
    const { username, repo } = info;
    const url = `https://api.github.com/repos/${username}/${repo}`;
    return axios.get(url);
}

// Create a table of contents for the information
function tableOfContents(repo, content, license) {
    let table = `<details>\n<summary>Table of Contents</summary>\n\n## Table of Contents\n* Description\n`;
    table += content.install ? `* [Installation](#installation)\n` : '';
    table += content.usage ? `* [Usage](#usage)\n` : "";
    table += repo.license !== "None" || license.license !== "None" ? `* [License](#license)\n` : '';
    table += content.contribute ? `* [Contributing](#contributing)\n` : '';
    table += content.test ? `* [Testing](#testing)\n` : '';
    table += `* [User Info](#user-info)\n\n</details>`;
    return table;
}

// Generate the README
async function readmeGenerator(repo, content, license) {
    try {
        let readme = "";
        //User Image
        readme += `<img src="${repo.owner.avatar_url}" alt="Github Image" width="150" align="right" style="margin: 50px 0 0 10px"/>\n\n`;
        //Title
        const title = (content.title || repo.name);
        readme += `# ${title}\n\n`;
        // Add README badge
        if (license !== true) {
            if (repo.license !== "none") {
                readme += `[![Generic badge](https://img.shields.io/badge/license-${license.license}-green.svg)](https://shields.io/) `;
            }
        } else {
            readme += `[![GitHub license](https://img.shields.io/github/license/${repo.owner.login}/${repo.name})](https://github.com/${repo.owner.login}/${repo.name}/blob/master/LICENSE) `;
        }
        readme += (content.contribute == true) ? `[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](https://www.contributor-covenant.org/version/2/0/code_of_conduct/code_of_conduct.md)\n\n` : '\n\n';
        // Add Description
        readme += `${content.description}\n\n`;
        // Add a test link (if applicable)
        readme += repo.homepage ? `Test out the project here: [${repo.name}](${repo.homepage})\n\n` : '';
        // Add the table of contents
        readme += `${tableOfContents(repo, content, license)}\n\n`;
        // Add installation steps
        readme += content.install ? `## Installation\n${content.install}\n\n` : '';
        // Add usage
        readme += content.usage ? `## Usage\n${content.usage}\n\n` : '';
        // Add licensing
        readme += (repo.license !== "none" || license.license !== "none") ? `## License\nThis repository uses an open-source license. For more information, please refer to the license documentation in the repository.\n\n` : '';
        // Add contribution(s)
        readme += content.contribute ? `## Contributing\nPlease note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.\n\n` : '';
        // Add testing
        readme += content.test ? `## Testing\nTo test this project, run the following commands:\n${content.test}\n\n` : '';
        // Add user info
        readme += `## User Info\nThis project was created by ${repo.owner.login}.\nPlease contact them here to report any issues: <a href="mailto:${content.email}">Report Issues</a>\n\n`
        return readme;
    } catch(err) {
        console.log(err);
    }
}

async function init() {
    try {
        console.log("\nWelcome to my automated CLI README Generator! :)");
        console.log("Please provide all information as accurate as possible.\n");
        const github = await userPrompt(githubQuestions);
        const response = await githubInfo(github);
        const gitInfo = response.data;
        const readmeInfo = await userPrompt(readmeQuestions);
        const liChoice = (gitInfo.license !== null) ? true : await userPrompt(licenseChoice);
        const readmeGen = await readmeGenerator(gitInfo, readmeInfo, liChoice, github);
        await asyncWrite(`${gitInfo.name}_README.md`, readmeGen);
        console.log(`\n${gitInfo.name}_README.md has been generated successfully!`)
    }
    catch (err) {
        if (err.response.status) {
            console.log("You have provided incorrect GitHub information. No user or repo could be found.")
        }
        else {
            console.log(err)
        }
    }
}

init();
