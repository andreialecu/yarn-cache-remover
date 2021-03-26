# yarn-cache-remover

## EXPERIMENTAL! USE AT YOUR OWN RISK!

This will nuke `.yarn/cache` out of existence from a git repository.

It uses [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) and rewrites history, so use at your own risk.

It works by first cloning a repo with the `--mirror` flag into a temp path. It will then compute a list of git object ids of files in `.yarn/cache` and delete them.

### Usage:
```
yarn dlx yarn-cache-remover git@github.com:myorg/myrepo.git --outDir /tmp/berry-no-cache
```

The pruned repository will be stored in `<outDir>/repo-mirror`.

You can also specify multiple cache paths to prune:
```
yarn dlx yarn-cache-remover git@github.com:myorg/myrepo.git --cachePath .yarn/cache -cachePath other/someproj/.yarn/cache --outDir /tmp/berry-no-cache
```

### Example output:
```
Downloading BFG...
Cloning into bare repository 'repo-mirror'...
remote: Enumerating objects: 525, done.
remote: Counting objects: 100% (525/525), done.
remote: Compressing objects: 100% (396/396), done.
remote: Total 96534 (delta 301), reused 247 (delta 123), pack-reused 96009
Receiving objects: 100% (96534/96534), 1.23 GiB | 15.80 MiB/s, done.
Resolving deltas: 100% (55647/55647), done.
Getting blobs related to .yarn/cache/*
Found 10610 blobs to delete.
Removing blobs, do not intrerrupt this process.
  In total, 17684 object ids were changed. Full details are logged here:
        /private/tmp/berry-no-cache/repo-mirror.bfg-report/2021-03-24/19-42-03
  BFG run is complete! When ready, run: git reflog expire --expire=now --all && git gc --prune=now --aggressive
Done removing blobs.
Repository size before: 1.24 GiB
Pruning repo... please wait, this may take a while
Repository size after: 123.92 MiB

Go to /tmp/berry-no-cache/repo-mirror and inspect the changes then push it, if desired. Remember that it's a mirror, so the files will not be visible. Git commands should work though.
```
