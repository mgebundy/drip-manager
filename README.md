# Drip Manager
> Download your Drip releases via a nice command line tool

** Does not run 100% on Windows currently **

## Install
```console
$ npm install -g drip-manager
```
It depends on `avprobe` to really reach its full potential. Download `libav` [here](https://libav.org/download/).
Also optionally `metaflac` to get certain flac file metadata.

## Configuration
We need your cookies or it won't work. Put a file named `cookies.txt` in your home directory with Netscape-style cookies from your `drip.kickstarter.com`

Create a file in your home directory called `.drip-managerrc` to customize other options such as the folder your music syncs to. Here are the defaults...

```
musicFolder = ~/Music
cookieFile  = ~/cookies.txt

; list of formats, in order of preference.
; if one isn't available, we'll download the next
preferredFormats[] = flac
preferredFormats[] = wav

[templates]
track = '${track} ${artist} - ${title}.${format}'
```

## Usage
It's simple...
```console
$ getdrip https://drip.kickstarter.com/ninjatune/releases/jay-daniel-broken-knowz
```
and it will download, extract, cleanup and move according to your parameters.


## Known issues
 - Not compatible with Windows because of the use of Unix's `mv`
 - Only the FLAC format really works.

## @TODO
 - Use nicer authentication, not cookies file
 - Template for album folders
 - Get another format, if first one isn't available
 - Label files of other format types properly
