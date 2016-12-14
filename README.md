# Drip Manager
> Download your Drip releases via a nice command line tool

** Does not run 100% on Windows currently **

## Install
[![NPM](https://nodei.co/npm/drip-manager.png)](https://nodei.co/npm/drip-manager/)

## Configuration
In your home directory create a `config` file in `.config/drip-manager`, this is to customize other options such as the folder your music syncs to. Here are the defaults...

```
musicFolder = ~/Music

; list of formats, in order of preference.
; if one isn't available, we'll download the next
preferredFormats[] = flac
preferredFormats[] = wav

[templates]
track = '${track} ${artist} - ${title}.${format}'

; if the cli login isn't for you, go ahead and
; put your Netscape-style cookies in this file...
cookieFile  = ~/.config/drip-manager/cookies
```

## Usage
It's simple...
```console
$ getdrip https://drip.kickstarter.com/ninjatune/releases/jay-daniel-broken-knowz
```
If it's your first time running the command, it will ask you to log in with your Drip credentials. Every other time (until your session expires) it will download, extract, cleanup and move a release according to your parameters.
