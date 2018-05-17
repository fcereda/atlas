#!/bin/bash

mkdir dist
mkdir dist/candidatos
mkdir dist/totais
mkdir dist/maisvotados

cd data
rm *.txt
unzip votacao_candidato_munzona_2014.zip -x *.pdf
unzip votacao_partido_munzona_2014.zip -x *.pdf
cd ..
node buildfiles -a 2014

cd data
rm *.txt
unzip votacao_candidato_munzona_2010.zip -x *.pdf
unzip votacao_partido_munzona_2010.zip -x *.pdf
cd ..
node buildfiles -a 2010

cd data
rm *.txt
unzip votacao_candidato_munzona_2006.zip -x *.pdf
unzip votacao_partido_munzona_2006.zip -x *.pdf
cd ..
node buildfiles -a 2006

cd data
rm *.txt
unzip votacao_candidato_munzona_2002.zip -x *.pdf
unzip votacao_partido_munzona_2002.zip -x *.pdf
cd ..
node buildfiles -a 2002

cd data
rm *.txt
unzip votacao_candidato_munzona_1998.zip -x *.pdf
unzip votacao_partido_munzona_1998.zip -x *.pdf
cd ..
node buildfiles -a 1998

cd data
rm *.txt
cd ..
