'use strict';

const { execSync } = require('child_process');

const defaults = {
  authorEmailCommand: 'git log --format="%ae" -n 1',
  blameCommand: 'git blame --porcelain',
  blameEmailClean: /[<>]/g,
  branchChangesCommand: 'git diff --numstat $(git merge-base master HEAD)',
  branchCommand: 'git branch --show-current',
  changeSetCommand: 'git log --first-parent --pretty="format:%H, %aE, %cN, %s"',
  changeSetRegExp: /^(\w{40}),\s(.*?),\s(.*?),\s(.*)$/,
  configCommand: 'git config',
  emailRegExp: /(@.*)$/,
  grepCommand: 'git grep',
  mergeBaseCommand: 'git merge-base master HEAD',
  notesCommands: 'git notes',
  origin: /^origin\//,
  shaCommand: 'git rev-parse HEAD',
  statusCommand: 'git status --branch --porcelain --untracked-files=all',
};

function gitAuthorEmail () {
  return execSync(defaults.authorEmailCommand, { cwd: process.cwd() }).toString().
    trim();
}

function gitBlame (file, lineNumber) {
  const summary = execSync(
    `${ defaults.blameCommand } -L${ lineNumber },${ lineNumber } ${ file }`,
    { cwd: process.cwd() }).toString().
    trim().
    split(/\n/);

  const hashInformation = summary[0].split(/\s+/);
  const blame = {
    hash: hashInformation[0],
    additions: hashInformation[1],
    deletions: hashInformation[2],
    author: { },
    committer: {},
  };

  for (let i = 1; i < summary.length - 1; i++) {
    const [ , type, value ] = summary[i].match(/^(.*?)\s(.*)$/);
    let previousInformation;

    switch (type) {
      case 'author':
        blame.author.name = value;
        break;
      case 'author-mail':
        blame.author.email = value.replace(defaults.blameEmailClean, '');
        break;
      case 'author-time':
        blame.author.date = new Date(Number(value) * 1000);
        break;
      case 'committer':
        blame.committer.name = value;
        break;
      case 'committer-mail':
        blame.committer.email = value.replace(defaults.blameEmailClean, '');
        break;
      case 'committer-time':
        blame.committer.date = new Date(Number(value) * 1000);
        break;
      case 'summary':
        blame.summary = value;
        break;
      case 'previous':
        previousInformation = value.split(/\s+/);
        blame.previous = {
          hash: previousInformation[0],
          file: previousInformation[1],
        };
        break;
      case 'filename':
        blame.file = value;
        break;
      default:
        break;
    }
  }

  blame.line = summary[summary.length - 1].slice(1);

  return blame;
}

function gitBranch () {
  let branch = process.env.GIT_BRANCH || process.env.BRANCH_NAME;
  if (!branch) {
    branch = execSync(defaults.branchCommand, { cwd: process.cwd() }).toString();
  }
  branch = branch || 'detached HEAD';
  return branch.trim().replace(defaults.origin, '');
}

function gitBranchChanges () {
  return execSync(defaults.branchChangesCommand, { cwd: process.cwd() }).toString().
    trim().
    split('\n').
    map((line) => {
      const [ additions, deletions, file ] = line.split(/\s+/);
      return {
        file,
        additions,
        deletions,
      };
    });
}

function gitChangeSet (initialCommit) {
  let command = defaults.changeSetCommand;
  if (initialCommit) {
    command += ` "${ initialCommit }..HEAD"`;
  } else if (process.env.LAST_SUCCESSFUL_COMMIT) {
    command += ` "${ process.env.LAST_SUCCESSFUL_COMMIT }..HEAD"`;
  } else {
    return null;
  }

  const changes = execSync(command, { cwd: process.cwd() }).toString().
    trim().
    split('\n');

  const changeSet = {};

  changes.forEach((change) => {
    if (defaults.changeSetRegExp.test(change)) {
      const [ , hash, email, name, title ] = change.match(defaults.changeSetRegExp);

      if (defaults.emailRegExp.test(email)) {
        const id = email.replace(defaults.emailRegExp, '').toLowerCase();

        changeSet[id] = changeSet[id] || {
          id,
          name,
          email,
          changes: [],
        };

        changeSet[id].changes.push({
          short: hash.substring(0, 12),
          hash,
          title,
        });
      }
    }
  });

  return changeSet;
}

function gitConfig (name, value) {
  if (name) {
    let command = `${ defaults.configCommand } ${ name }`;
    if (value) {
      command += ` ${ value }`;
    }
    return execSync(command, { cwd: process.cwd() }).toString().
      trim();
  }
  return '';
}

function gitGrep (pattern) {
  return execSync(`${ defaults.grepCommand } ${ pattern }`, { cwd: process.cwd() }).toString().
    trim().
    split('\n').
    map((line) => line.match(/^([^:]+):(.*?)$/).slice(1, 3));
}

function gitMergeBase () {
  try {
    return execSync(defaults.mergeBaseCommand, {
      cwd: process.cwd(),
      stdio: [ 'pipe', 'pipe', 'ignore' ],
    }).toString().
      trim();
  } catch (error) { // Likely a shallow clone
    return null;
  }
}

function gitNotesAdd (message, prefix, force) {
  try {
    let command = defaults.notesCommand;
    if (prefix) {
      command += ` --ref=${ prefix }`;
    }

    command += ` add -m "${ message }"`;

    if (force) {
      command += ' -f';
    }

    execSync(command, {
      cwd: process.cwd(),
      stdio: 'ignore',
    });

    return true;
  } catch (error) {
    return false;
  }
}

function gitNotesRemove (prefix) {
  try {
    let command = defaults.notesCommand;
    if (prefix) {
      command += ` --ref=${ prefix }`;
    }
    command += ' remove';

    execSync(command, {
      cwd: process.cwd(),
      stdio: 'ignore',
    });

    return true;
  } catch (error) {
    return false;
  }
}

function gitNotesShow (prefix) {
  try {
    let command = defaults.notesCommand;
    if (prefix) {
      command += ` --ref=${ prefix }`;
    }
    command += ' show';

    const notes = execSync(command, {
      cwd: process.cwd(),
      stdio: [ 'pipe', 'pipe', 'ignore' ],
    }).toString().
      trim();

    if (notes.startsWith('error: No note found')) {
      return null;
    }
    return notes;
  } catch (error) {
    return null;
  }
}

function gitSHA () {
  return execSync(defaults.shaCommand, { cwd: process.cwd() }).toString().
    trim();
}

function gitStatus () {
  const status = execSync(defaults.statusCommand, { cwd: process.cwd() }).toString().
    trim().
    split('\n');

  let [ branch, ...changes ] = status;

  branch = branch.replace('## ', '');
  changes = changes.map((item) => item.replace(/^[ ][MD]\s+(.*)$/, '$1 (modified)').
    replace(/^M[ MD]\s+(.*)$/, '$1 (modified in index)').
    replace(/^A[ MD]\s+(.*)$/, '$1 (added)').
    replace(/^D[ M]\s+(.*)$/, '$1 (deleted)').
    replace(/^R[ MD]\s+(.*)$/, '$1 (renamed)').
    replace(/^C[ MD]\s+(.*)$/, '$1 (copied)').
    replace(/^[MARC][ ]\s+(.*)$/, '$1 (index and work tree matches)').
    replace(/^[ MARC]M\s+(.*)$/, '$1 (work tree changed since index)').
    replace(/^[ MARC]D\s+(.*)$/, '$1 (deleted in work tree)').
    replace(/^DD\s+(.*)$/, '$1 (unmerged, both deleted)').
    replace(/^AU\s+(.*)$/, '$1 (unmerged, added by us)').
    replace(/^UD\s+(.*)$/, '$1 (unmerged, deleted by them)').
    replace(/^UA\s+(.*)$/, '$1 (unmerged, added by them)').
    replace(/^DU\s+(.*)$/, '$1 (unmerged, deleted by us)').
    replace(/^AA\s+(.*)$/, '$1 (unmerged, both added)').
    replace(/^UU\s+(.*)$/, '$1 (unmerged, both modified)').
    replace(/^\?\?\s+(.*)$/, '$1 (untracked)').
    replace(/^!!\s+(.*)$/, '$1 (ignored)')).sort();

  return {
    branch,
    changes,
    clean: !changes.length,
  };
}

module.exports = {
  authorEmail: gitAuthorEmail,
  blame: gitBlame,
  branch: gitBranch,
  branchChanges: gitBranchChanges,
  changeSet: gitChangeSet,
  config: Object.assign(gitConfig, {
    alias: (name, value) => gitConfig(`alias.${ name }`, value),
    editor: (value) => gitConfig('editor', value),
    email: (value) => gitConfig('user.email', value),
    user: (value) => gitConfig('user.name', value),
  }),
  defaults,
  grep: gitGrep,
  mergeBase: gitMergeBase,
  notes: {
    add: gitNotesAdd,
    remove: gitNotesRemove,
    show: gitNotesShow,
  },
  sha: gitSHA,
  status: gitStatus,
};
