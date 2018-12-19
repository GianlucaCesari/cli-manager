#! /usr/bin/env node

/* eslint-disable no-console */
const inquirer = require('inquirer');
const servers = require('../assets/servers.json');
const Connection = require('ssh2');
const Table = require('cli-table');

let options = {};
const promptOptions = [];

servers.forEach((element) => {
	const tmp = {};
	tmp.id = element.id;
	tmp.name = element.name;
	promptOptions.push(tmp);
	promptOptions.push(new inquirer.Separator());
});

function main() {
	inquirer
		.prompt([{
			type: 'list',
			name: 'server',
			message: 'Choose the server',
			choices: promptOptions,
		}])
		.then((answers) => {
			const sel = servers.find(obj => obj.name === answers.server);
			let table = new Table({
				chars: {
					'top': '═',
					'top-mid': '╤',
					'top-left': '╔',
					'top-right': '╗',
					'bottom': '═',
					'bottom-mid': '╧',
					'bottom-left': '╚',
					'bottom-right': '╝',
					'left': '║',
					'left-mid': '╟',
					'mid': '─',
					'mid-mid': '┼',
					'right': '║',
					'right-mid': '╢',
					'middle': '│'
				}
			});

			table.push(sel.sites);

			console.log(table.toString()); // NON TOGLIERE

			inquirer.prompt({
				type: 'confirm',
				name: "confirm",
				message: "Is this the server?"
			}).then((answer) => {
				if (answer.confirm) {
					gs = null;
					let conn = new Connection();
					if (sel.key != '') {
						options = {
							host: sel.host,
							port: 22,
							username: sel.user,
							privateKey: require('fs').readFileSync(sel.key)
						}
					} else {
						options = {
							host: sel.host,
							port: 22,
							username: sel.user,
							password: sel.password
						}
					}

					conn.on('ready', function () {
						console.log('Connected ⌨️');
						conn.shell(function (err, stream) {
							if (err) throw err;
							stream.on('close', function () {
								console.log('Bye Bye 👋');
								conn.end();
								process.exit(1);
							}).on('data', function (data) {
								if (!gs) gs = stream;
								if (gs._writableState.sync == false) process.stdout.write('' + data);
							}).stderr.on('data', function (data) {
								console.log('STDERR: ' + data);
								process.exit(1);
							});
						});
					}).connect(options);

					var stdin = process.stdin;
					stdin.setRawMode(true);
					stdin.resume();
					stdin.setEncoding('utf8');
					stdin.on('data', function (key) {
						if (key === '\u0003') {
							process.exit();
						}
						if (gs) gs.write('' + key);
					})
				} else {
					main()
				}
			});
		});
}

main();