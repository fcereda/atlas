#!/bin/bash
curl "http://agencia.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2014.zip" > votacao_candidato_munzona_2014.zip
curl "http://agencia.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2014.zip" > votacao_partido_munzona_2014.zip
curl "http://agencia.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2010.zip" > votacao_candidato_munzona_2010.zip
curl "http://agencia.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2010.zip" > votacao_partido_munzona_2010.zip
curl "http://agencia.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2006.zip" > votacao_candidato_munzona_2006.zip
curl "http://agencia.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2006.zip" > votacao_partido_munzona_2006.zip
curl "http://agencia.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2002.zip" > votacao_candidato_munzona_2002.zip
curl "http://agencia.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2002.zip" > votacao_partido_munzona_2002.zip
curl "http://agencia.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1998.zip" > votacao_candidato_munzona_1998.zip
curl "http://agencia.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_1998.zip" > votacao_partido_munzona_1998.zip 
mkdir data
mv *.zip ./data