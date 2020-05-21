'use strict';

const childProcess = require('child_process');

const gitAuthorEmailCommand = 'git log --format="%ae" -n 1';
const gitBlameCommand = 'git blame --porcelain';
const gitBlameEmailClean = /[<>]/g;
const gitBranchChangesCommand = 'git diff --numstat $(git merge-base master HEAD)';
const gitBranchCommand = 'git rev-parse --abbrev-ref HEAD';
const gitChangeSetCommand = 'git log --first-parent --pretty="format:%H, %aE, %cN, %s"';
const gitChangeSetRegExp = /^(\w{40}),\s(.*?),\s(.*?),\s(.*)$/;
const gitHashCommand = 'git rev-parse HEAD';
const gitMergeBaseCommand = 'git merge-base master HEAD';
const gitOrigin = /^origin\//;
const gitStatusCommand = 'git status --branch --porcelain --untracked-files=all';

const emailRegExp = /(@.*)$/;

function gitBranch () {
  let branch = process.env.GIT_BRANCH || process.env.BRANCH_NAME;
  if (!branch) {
    branch = childProcess.execSync(gitBranchCommand, { cwd: process.cwd() }).toString();
  }
  branch = branch || 'detached HEAD';
  return branch.trim().replace(gitOrigin, '');
}

function gitHash () {
  return childProcess.execSync(gitHashCommand, { cwd: process.cwd() }).toString().
    trim();
}

function gitAuthorEmail () {
  return childProcess.execSync(gitAuthorEmailCommand, { cwd: process.cwd() }).toString().
    trim();
}

function gitBranchChanges () {
  return childProcess.execSync(gitBranchChangesCommand, { cwd: process.cwd() }).toString().
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

function gitBlame (file, lineNumber) {
  const summary = childProcess.execSync(
    `${ gitBlameCommand } -L${ lineNumber },${ lineNumber } ${ file }`,
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
        blame.author.email = value.replace(gitBlameEmailClean, '');
        break;
      case 'author-time':
        blame.author.date = new Date(Number(value) * 1000);
        break;
      case 'committer':
        blame.committer.name = value;
        break;
      case 'committer-mail':
        blame.committer.email = value.replace(gitBlameEmailClean, '');
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

function gitAddNotes (message, prefix, force) {
  try {
    let gitNotesCommand = 'git notes';
    if (prefix) {
      gitNotesCommand += ` --ref=${ prefix }`;
    }

    gitNotesCommand += ` add -m "${ message }"`;

    if (force) {
      gitNotesCommand += ' -f';
    }

    childProcess.execSync(gitNotesCommand, {
      cwd: process.cwd(),
      stdio: 'ignore',
    });

    return true;
  } catch (error) {
    return false;
  }
}

function gitRemoveNotes (prefix) {
  try {
    let gitNotesCommand = 'git notes';
    if (prefix) {
      gitNotesCommand += ` --ref=${ prefix }`;
    }
    gitNotesCommand += ' remove';

    childProcess.execSync(gitNotesCommand, {
      cwd: process.cwd(),
      stdio: 'ignore',
    });

    return true;
  } catch (error) {
    return false;
  }
}

function gitShowNotes (prefix) {
  try {
    let gitNotesCommand = 'git notes';
    if (prefix) {
      gitNotesCommand += ` --ref=${ prefix }`;
    }
    gitNotesCommand += ' show';

    const notes = childProcess.execSync(gitNotesCommand, {
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

function gitStatus () {
  const status = childProcess.execSync(gitStatusCommand, { cwd: process.cwd() }).toString().
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

function gitMergeBase () {
  try {
    return childProcess.execSync(gitMergeBaseCommand, {
      cwd: process.cwd(),
      stdio: [ 'pipe', 'pipe', 'ignore' ],
    }).toString().
      trim();
  } catch (error) { // Likely a shallow clone
    return null;
  }
}

function gitChangeSet (initialCommit) {
  let command = gitChangeSetCommand;
  if (initialCommit) {
    command += ` "${ initialCommit }..HEAD"`;
  } else if (process.env.LAST_SUCCESSFUL_COMMIT) {
    command += ` "${ process.env.LAST_SUCCESSFUL_COMMIT }..HEAD"`;
  } else {
    return null;
  }

  const changes = childProcess.execSync(command, { cwd: process.cwd() }).toString().
    trim().
    split('\n');

  const changeSet = {};

  changes.forEach((change) => {
    if (gitChangeSetRegExp.test(change)) {
      const [ , hash, email, name, title ] = change.match(gitChangeSetRegExp);

      if (emailRegExp.test(email)) {
        const id = email.replace(emailRegExp, '').toLowerCase();

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

module.exports = {
  gitAddNotes,
  gitAuthorEmail,
  gitBlame,
  gitBranch,
  gitBranchChanges,
  gitChangeSet,
  gitHash,
  gitMergeBase,
  gitRemoveNotes,
  gitShowNotes,
  gitStatus,
};
