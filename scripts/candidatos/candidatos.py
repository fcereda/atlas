import sys
import time
from urllib.request import urlopen, urlretrieve 
import json
import gzip
import csv


def urlGzipToJson (url):
    response = urlopen(url).read()
    #print (response)
    #exit()
    try:
        tmp = gzip.decompress(response).decode('utf-8')
    except: 
        tmp = response.decode('utf-8')  
    repo = json.loads(tmp)
    return repo

def urlToJson (url):
    response = urlopen(url).read()
    tmp = response.decode('utf-8')
    repo = json.loads(tmp)
    return repo

def loadUfs ():
    url = 'http://servicodados.ibge.gov.br/api/v1/localidades/estados'
    data = urlGzipToJson(url)
    return data

def loadCSV (url):
    time.sleep(10)

    # The following code works when CEPESP's API is in the mood:
    try:
        (csvFileName, headers) = urlretrieve(url)
    except Error:
        print('Error trying to retrieve ' + url)
        print(Error)
        exit()  

    csvFile = open(csvFileName, 'rt')
    rows = csv.DictReader(csvFile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)

    candidatos = []
    for row in rows:
        #print(row)
        candidato = {}
        for key in row:
            candidato[key] = row[key]
        #print(candidato)    
        candidatos.append(candidato)    

    csvFile.close()
    return candidatos     


def getUrl (ano, cargo):
    #url = 'http://cepesp.io/api/consulta/tse?ano={}&cargo={}'.format(ano, cargo)
    url = 'http://cepesp.io/api/consulta/tse?ano={}&cargo={}&agregacao_regional=1&agregacao_politica=2'.format(ano, cargo)
    campos = [
        'ANO_ELEICAO',
        'NUM_TURNO',
        'UF',  
        'CODIGO_CARGO',
        'NUMERO_CANDIDATO',
        'NOME_CANDIDATO',
        'CPF_CANDIDATO',
        'NOME_URNA_CANDIDATO',
        'NUMERO_PARTIDO',
        'SIGLA_PARTIDO',
        'COD_SIT_TOT_TURNO',
        'DESC_SIT_TOT_TURNO',
        'QTDE_VOTOS' ]

    for campo in campos:
        url += '&selected_columns[]=' + campo
    return url


def saveDictToFile (dict, fileName):
    file = open(fileName, 'w')


def saveAsCSV (list, fileName, headers=[]):
    if (len(headers) == 0):
        headers = []
        for key in list[0]:
            headers.append(key)
        print('Salvando os seguintes campos:')
        print(headers)

    with open(fileName, 'w', encoding='utf-8') as csvfile:
        fileWriter = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        fileWriter.writerow(headers)
        for item in list:
            #print('salvando:')
            #print(item)

            try:
                row = []
                for field in headers:
                    if (field in item):
                        row.append(item[field])
                    else:
                        row.append('')  
                fileWriter.writerow(row)
            except:
                print('Erro tentando gravar a seguinte linha:')
                print(item)
                exit()  


def groupByUf (candidatos):
    ufs = {}
    for candidato in candidatos:
        uf = candidato['UF'] + candidato['NUM_TURNO']
        if (not uf in ufs):
            ufs[uf] = []
        ufs[uf].append(candidato)

    return ufs    


def adjustCandidates (candidatos):
    for candidato in candidatos:
        candidato['CPF_CANDIDATO'] = candidato['CPF_CANDIDATO'].zfill(11)
        if (candidato['NOME_URNA_CANDIDATO'] == '#NULO#'):
            candidato['NOME_URNA_CANDIDATO'] = candidato['SIGLA_PARTIDO'] + ' (legenda)'
    return candidatos       


def addRanking (candidatos):

    def getKey(candidato):
        # Convertemos de string para float para int porque a API do CEPESP 
        # às vezes usa uma casa decimal no campo QTDE_VOTOS
        try:
            return int(float(candidato['QTDE_VOTOS']))
        except:
            return 0    

    ufs = groupByUf(candidatos)
    novaCandidatos = []
    for uf in ufs:
        ufs[uf] = sorted(ufs[uf], key=getKey, reverse=True)
        posicao = 1
        for candidato in ufs[uf]:
            candidato['CLASSIFICACAO'] = posicao
            posicao += 1
            novaCandidatos.append(candidato)
    return novaCandidatos


def runATest ():
    candidatos = loadCSV(getUrl(2014, 6))
    #for candidato in candidatos:
    #    print(candidato)
    correctPartyNames(candidatos)
    sortedCandidatos = addRanking(candidatos)
    candidatosSP = groupByUf(sortedCandidatos)['SP1']
    totalVotos = 0

    for candidato in candidatosSP:
        totalVotos += int(float(candidato['QTDE_VOTOS']))

    contador = 0
    for candidato in candidatosSP:
        if (contador < 100):
            print(candidato['CLASSIFICACAO'], candidato['NOME_CANDIDATO'], '"' + candidato['NOME_URNA_CANDIDATO'] + '"', candidato['DESC_SIT_TOT_TURNO'], candidato['UF'],'{:,}'.format(int(float(candidato['QTDE_VOTOS']))),'{0:.2f}%'.format(float(candidato['QTDE_VOTOS'])/totalVotos*100))
        contador += 1    

    print('Total de votos: {:,}'.format(totalVotos))
    print('Total / (vagas + 1): {:,}'.format(totalVotos/3+1))    


#runATest()
#exit()

fileName = 'candidatos.csv'
candidatos = []
for ano in [1998, 2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016]:
    for cargo in [1, 3, 5, 6, 7, 8, 11]:
        sys.stdout.write('Obtendo lista de candidatos para o ano {}, cargo {}...    \r'.format(ano, cargo))
        sys.stdout.flush()
        candidatos = candidatos + addRanking(adjustCandidates(loadCSV(getUrl(ano, cargo))))
print('\nGravando lista de candidatos no arquivo ' + fileName)
saveAsCSV(candidatos, fileName)
print('{} linhas foram gravadas no arquivo {}'.format(len(candidatos), fileName))
exit()
