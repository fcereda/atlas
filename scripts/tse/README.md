# How to generate the data files:

1) load the ZIP files from TSE's data repository by running:
`
sh loadfiles.sh
`

2) load all npm modules required by the buildfiles program, by running:
`
npm install
`

3) run buildfiles:
`
node buildfiles
`


After completion, the datafiles will be in /dist directory. Just move the contents of /dist to the /server/data/tse directory and let the Atlas server do the rest.

